import { env, isGeminiConfigured } from '../config/env.js';

/**
 * Thin server-side client for the Gemini REST API.
 *
 * The API key never leaves the server: the browser only ever talks to
 * /api/ai/*. Errors are translated into a small, stable set of codes so the
 * frontend can show an honest message instead of leaking provider internals.
 */
export class AiUnavailableError extends Error {
  constructor(code, message, retryAfterSeconds) {
    super(message);
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const ERROR_MESSAGES = {
  NOT_CONFIGURED:
    'AI features are not configured on this server. Add GEMINI_API_KEY to the backend environment.',
  QUOTA:
    'The Gemini free-tier quota for this project is exhausted right now. Try again later — the rule-based analyzer and all portfolio editing features still work.',
  RATE:
    'Too many AI requests in a short time. Wait a few seconds and try again.',
  TIMEOUT: 'The AI service took too long to respond. Please try again.',
  UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again shortly.',
  BAD_RESPONSE: 'The AI service returned a response that could not be used. Try regenerating.',
  INVALID_KEY: 'The configured Gemini API key was rejected. Check GEMINI_API_KEY on the server.',
};

const buildError = (code, retryAfterSeconds) =>
  new AiUnavailableError(code, ERROR_MESSAGES[code] || ERROR_MESSAGES.UNAVAILABLE, retryAfterSeconds);

export const isAiEnabled = () => isGeminiConfigured();

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
 * @param {{ prompt: string, system?: string, json?: boolean, temperature?: number, maxOutputTokens?: number }} options
 */
export async function callGemini({
  prompt,
  system,
  json = false,
  temperature = 0.6,
  maxOutputTokens = 1200,
}) {
  if (!isGeminiConfigured()) throw buildError('NOT_CONFIGURED');

  const url = `${env.gemini.apiBaseUrl}/v1beta/models/${encodeURIComponent(env.gemini.model)}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.gemini.timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.gemini.apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') throw buildError('TIMEOUT');
    throw buildError('UNAVAILABLE');
  }
  clearTimeout(timer);

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const providerMessage = payload?.error?.message || '';
    if (response.status === 429) {
      const isDaily = /per day|daily/i.test(providerMessage);
      throw buildError(isDaily ? 'QUOTA' : 'RATE', extractRetryAfter(payload));
    }
    if (response.status === 400 && /api key not valid|api_key_invalid/i.test(providerMessage)) {
      throw buildError('INVALID_KEY');
    }
    if (response.status === 401 || response.status === 403) throw buildError('INVALID_KEY');
    if (response.status === 404) {
      // Model name not available for this key/region.
      throw new AiUnavailableError(
        'UNAVAILABLE',
        `The configured Gemini model (${env.gemini.model}) is not available for this API key. ` +
          'Set GEMINI_MODEL to a model enabled for your project.'
      );
    }
    if (response.status >= 500) throw buildError('UNAVAILABLE');
    throw new AiUnavailableError('UNAVAILABLE', ERROR_MESSAGES.UNAVAILABLE);
  }

  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    if (candidate?.finishReason === 'SAFETY') {
      throw new AiUnavailableError(
        'BAD_RESPONSE',
        'The AI declined to generate this content. Adjust the wording and try again.'
      );
    }
    throw buildError('BAD_RESPONSE');
  }

  return { text, model: env.gemini.model, finishReason: candidate?.finishReason || null };
}

/** Best-effort JSON extraction: tolerates code fences and leading prose. */
export const parseJsonFromText = (text) => {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/^\uFEFF/, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through to bracket extraction */
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
};

export { ERROR_MESSAGES as AI_ERROR_MESSAGES };
