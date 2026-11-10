import { env, isGeminiConfigured } from '../config/env.js';

/**
 * Thin server-side client for the Gemini REST API.
 *
 * The API key never leaves the server: the browser only ever talks to
 * /api/ai/*. Provider failures are translated into a small, stable set of
 * codes so the frontend can show an honest message instead of leaking
 * provider internals.
 *
 * The Project Builder and the portfolio-writing features deliberately use
 * different keys and models (see `config/env.js`):
 *
 *   portfolio → GEMINI_PORTFOLIO_API_KEY / GEMINI_MODEL
 *   projects  → GEMINI_PROJECT_API_KEY  / GEMINI_PROJECT_MODEL
 *
 * This module is the portfolio path by default. `aiProvider.js` passes the
 * project key and model explicitly, so the two integrations cannot silently
 * borrow each other's credentials.
 */
export class AiUnavailableError extends Error {
  constructor(code, message, retryAfterSeconds, meta = {}) {
    super(message);
    this.name = 'AiUnavailableError';
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.providerStatus = meta.providerStatus;
    this.provider = meta.provider || 'gemini';
    this.stage = meta.stage || '';
  }
}

const ERROR_MESSAGES = {
  NOT_CONFIGURED:
    'AI features are not configured on this server. Add GEMINI_PORTFOLIO_API_KEY (or GEMINI_API_KEY) to the backend environment.',
  QUOTA:
    'The Gemini quota for this project is exhausted right now. Try again later — the rule-based analyzer and all portfolio editing features still work.',
  RATE: 'Too many AI requests in a short time. Wait a few seconds and try again.',
  TIMEOUT: 'The AI service took too long to respond. Please try again.',
  UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again shortly.',
  BAD_RESPONSE: 'The AI service returned a response that could not be used. Try regenerating.',
  TRUNCATED:
    'The AI response was cut off before it finished (output token limit). Try again, or use a smaller project complexity.',
  BLOCKED: 'The AI declined to generate this content. Adjust the wording and try again.',
  INVALID_KEY: 'The configured Gemini API key was rejected. Check the AI key on the server.',
  PERMISSION:
    'The Gemini API rejected this request (403). Enable the Generative Language API for the key’s Google Cloud project, or use a key that has access.',
  MODEL_NOT_FOUND: 'The configured Gemini model is not available for this API key.',
};

export const isAiEnabled = () => isGeminiConfigured();

/**
 * Picks the thinking configuration each model family actually accepts.
 *
 * This is deliberately capability-based rather than a broad regex. Gemini 2.5
 * accepts `thinkingBudget: 0` to disable thinking. Gemini 3.x cannot disable
 * thinking, and `gemini-3.5-flash-lite` rejects `thinkingBudget: 0` with
 * HTTP 400 INVALID_ARGUMENT; its documented lowest level is `thinkingLevel:
 * "low"`. Unknown models get no thinkingConfig at all, which is always a
 * valid request.
 */
export const thinkingConfigForModel = (model, thinkingBudget) => {
  const name = String(model || '').trim();
  const budget = Number(thinkingBudget);
  if (!name || !Number.isFinite(budget) || budget < 0) return null;

  // Gemini 2.5 family: a zero budget is the documented way to turn thinking off.
  if (/^gemini-2\.5(?:-|$)/i.test(name)) {
    return { thinkingBudget: Math.max(0, Math.floor(budget)) };
  }

  // Gemini 3.x cannot fully disable thinking. `low` is the lowest level shared
  // by the 3.x Flash, Flash-Lite and Pro families (3.8 Flash rejects `minimal`).
  if (/^gemini-3(?:[.-]|$)/i.test(name)) {
    return budget === 0 ? { thinkingLevel: 'low' } : null;
  }

  // Aliases and future model ids are left alone rather than guessing a field
  // the model may reject.
  return null;
};

/** Redacts credential-shaped values before any provider detail is logged. */
const redactSecrets = (value) =>
  String(value || '')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-key]')
    .replace(/([?&](?:key|api_key|apikey)=)[^&\s"']+/gi, '$1[redacted]')
    .replace(/("(?:apiKey|api_key|key)"\s*:\s*")[^"]+/gi, '$1[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');

/**
 * One safe server log line per provider failure.
 *
 * Captures Google's status/message/details and any BadRequest field
 * violations so a 400 is actionable. It never logs the prompt, request body,
 * API key or any other credential.
 */
const logProviderFailure = ({ status, code, model, stage, detail, payload, requestId }) => {
  const safeDetail = redactSecrets(String(detail || '').replace(/[\r\n]+/g, ' ')).slice(0, 500);
  let providerError = '';
  if (payload?.error) {
    try {
      providerError = redactSecrets(JSON.stringify(payload.error)).slice(0, 1600);
    } catch {
      providerError = '';
    }
  }
  console.warn(
    `[gemini] stage=${stage || 'request'} requestId=${requestId || 'n/a'} status=${status || 'n/a'} ` +
      `model=${model || 'n/a'} code=${code}` +
      (safeDetail ? ` detail="${safeDetail}"` : '') +
      (providerError ? ` providerError=${providerError}` : '')
  );
};

const extractRetryAfter = (payload) => {
  const details = payload?.error?.details;
  if (Array.isArray(details)) {
    const retry = details.find((detail) => detail?.retryDelay);
    if (retry?.retryDelay) {
      const seconds = parseFloat(String(retry.retryDelay).replace('s', ''));
      if (Number.isFinite(seconds)) return Math.ceil(seconds);
    }
  }
  return undefined;
};

/**
 * Sends one prompt to Gemini and returns the raw text response.
 *
 * `apiKey` / `model` are explicit so the Project Builder can use its own
 * credentials without changing the portfolio key.
 *
 * @param {{
 *   prompt: string, system?: string, json?: boolean, temperature?: number,
 *   maxOutputTokens?: number, model?: string, timeoutMs?: number,
 *   apiKey?: string, stage?: string, requestId?: string
 * }} options
 */
export async function callGemini({
  prompt,
  system,
  json = false,
  temperature = 0.6,
  maxOutputTokens = 1200,
  model = env.gemini.model,
  timeoutMs = env.gemini.timeoutMs,
  apiKey = env.gemini.apiKey,
  apiBaseUrl = env.gemini.apiBaseUrl,
  thinkingBudget,
  stage = 'portfolio',
  requestId = '',
}) {
  if (!apiKey) {
    logProviderFailure({ status: 'n/a', code: 'NOT_CONFIGURED', model, stage, requestId });
    throw new AiUnavailableError('NOT_CONFIGURED', ERROR_MESSAGES.NOT_CONFIGURED, undefined, { stage });
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const thinkingConfig = thinkingConfigForModel(model, thinkingBudget);
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      candidateCount: 1,
      ...(json ? { responseMimeType: 'application/json' } : {}),
      /*
       * Project generation needs the output budget for JSON/files. The exact
       * thinking field depends on the model family; see
       * `thinkingConfigForModel` above.
       */
      ...(thinkingConfig ? { thinkingConfig } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 25000));

  /*
   * Read the body while the abort timer is still armed. A provider (or a
   * proxy) can return headers and then stall the body forever; clearing the
   * timeout after `fetch` would leave the request hanging.
   */
  let response;
  let raw = '';
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    raw = await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      logProviderFailure({ status: 'timeout', code: 'TIMEOUT', model, stage, requestId, detail: `${timeoutMs}ms` });
      throw new AiUnavailableError('TIMEOUT', ERROR_MESSAGES.TIMEOUT, undefined, { stage });
    }
    const bodyFailure = Boolean(response);
    const code = bodyFailure ? 'BAD_RESPONSE' : 'UNAVAILABLE';
    logProviderFailure({
      status: response?.status || 'network',
      code,
      model,
      stage,
      requestId,
      detail: `${bodyFailure ? 'could not read response body' : 'network failure'}: ${error?.message}`,
    });
    throw new AiUnavailableError(code, ERROR_MESSAGES[code], undefined, {
      providerStatus: response?.status,
      stage,
    });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const providerMessage = String(payload?.error?.message || '');
    const providerStatusText = String(payload?.error?.status || '');
    const combined = `${providerMessage} ${providerStatusText}`;
    let code = 'UNAVAILABLE';
    let message;

    if (response.status === 429) {
      const isDaily = /per day|daily/i.test(combined);
      code = isDaily ? 'QUOTA' : 'RATE';
    } else if (
      response.status === 400 &&
      /api[ _-]?key not valid|api[ _-]?key expired|invalid api key|API_KEY_INVALID|API key/i.test(combined)
    ) {
      code = 'INVALID_KEY';
    } else if (response.status === 401) {
      code = 'INVALID_KEY';
    } else if (response.status === 403) {
      code = /api[ _-]?key|unauthenticated|credential/i.test(combined) ? 'INVALID_KEY' : 'PERMISSION';
    } else if (response.status === 404) {
      code = 'MODEL_NOT_FOUND';
      message =
        `The configured Gemini model (${model}) is not available for this API key. ` +
        'Set GEMINI_PROJECT_MODEL (Project Builder) or GEMINI_MODEL (portfolio AI) to a model enabled for your project.';
    } else if (response.status === 413) {
      code = 'BAD_RESPONSE';
      message = 'The AI request was too large for the configured model. Use a smaller project complexity or fewer files.';
    } else if (response.status >= 500) {
      code = 'UNAVAILABLE';
    } else if (response.status === 400) {
      code = 'BAD_RESPONSE';
      message =
        'The AI provider rejected the model settings (400 INVALID_ARGUMENT). Check the configured Gemini model and thinking settings on the server.';
    }

    logProviderFailure({
      status: response.status,
      code,
      model,
      stage,
      requestId,
      detail: providerMessage || providerStatusText,
      payload,
    });

    throw new AiUnavailableError(code, message || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNAVAILABLE, extractRetryAfter(payload), {
      providerStatus: response.status,
      stage,
    });
  }

  if (!payload) {
    logProviderFailure({
      status: response.status,
      code: 'BAD_RESPONSE',
      model,
      stage,
      requestId,
      detail: `HTTP 200 but the body was not valid JSON (${raw.length} bytes)`,
    });
    throw new AiUnavailableError('BAD_RESPONSE', ERROR_MESSAGES.BAD_RESPONSE, undefined, {
      providerStatus: response.status,
      stage,
    });
  }

  const blockReason = payload?.promptFeedback?.blockReason;
  const candidate = payload?.candidates?.[0];
  const finishReason = candidate?.finishReason || null;
  const text = (candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('')
    .trim();

  if (blockReason || ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'].includes(finishReason)) {
    logProviderFailure({
      status: response.status,
      code: 'BLOCKED',
      model,
      stage,
      requestId,
      detail: blockReason || finishReason,
    });
    throw new AiUnavailableError('BLOCKED', ERROR_MESSAGES.BLOCKED, undefined, {
      providerStatus: response.status,
      stage,
    });
  }

  if (!text) {
    const code = finishReason === 'MAX_TOKENS' ? 'TRUNCATED' : 'BAD_RESPONSE';
    logProviderFailure({ status: response.status, code, model, stage, requestId, detail: finishReason || 'empty response' });
    throw new AiUnavailableError(code, ERROR_MESSAGES[code], undefined, {
      providerStatus: response.status,
      stage,
    });
  }

  /*
   * A MAX_TOKENS finish reason means the model ran out of output budget. For
   * JSON requests, accept the response only when the JSON is actually complete;
   * otherwise fail loudly instead of handing truncated JSON to the parser.
   */
  if (json && finishReason === 'MAX_TOKENS') {
    const parsed = parseJsonFromText(text);
    if (!parsed) {
      logProviderFailure({
        status: response.status,
        code: 'TRUNCATED',
        model,
        stage,
        requestId,
        detail: `MAX_TOKENS with incomplete JSON (${text.length} chars)`,
      });
      throw new AiUnavailableError('TRUNCATED', ERROR_MESSAGES.TRUNCATED, undefined, {
        providerStatus: response.status,
        stage,
      });
    }
  }

  return { text, model, finishReason, truncated: finishReason === 'MAX_TOKENS' };
}

/**
 * Extracts the first complete JSON object/array from model text without
 * rewriting the JSON itself.
 *
 * Handles code fences, prose before/after the JSON, escaped quotes and braces
 * inside strings. Truncated JSON is reported as `TRUNCATED`; it is never
 * "repaired", because closing a truncated source file would hide corruption.
 */
export const parseJsonResponse = (text) => {
  if (typeof text !== 'string' || !text.trim()) return { value: null, error: 'EMPTY' };

  let cleaned = text.replace(/^\uFEFF/, '').trim();
  // Remove a single wrapping markdown fence. Fences inside string values are
  // left untouched because only the leading/trailing delimiters are stripped.
  cleaned = cleaned
    .replace(/^```[a-zA-Z0-9_-]*[ \t]*\r?\n?/, '')
    .replace(/\r?\n?```[ \t]*$/, '')
    .trim();

  try {
    return { value: JSON.parse(cleaned), error: null };
  } catch {
    /* fall through to balanced extraction */
  }

  const objectStart = cleaned.indexOf('{');
  const arrayStart = cleaned.indexOf('[');
  const starts = [objectStart, arrayStart].filter((index) => index !== -1);
  if (!starts.length) return { value: null, error: 'NO_JSON' };

  const start = Math.min(...starts);
  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        const candidate = cleaned.slice(start, index + 1);
        try {
          return { value: JSON.parse(candidate), error: null };
        } catch {
          return { value: null, error: 'INVALID' };
        }
      }
    }
  }

  return { value: null, error: 'TRUNCATED' };
};

/** Backwards-compatible helper used by the portfolio AI features. */
export const parseJsonFromText = (text) => parseJsonResponse(text).value;

export { ERROR_MESSAGES as AI_ERROR_MESSAGES };
