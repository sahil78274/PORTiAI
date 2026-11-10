import { env } from '../config/env.js';
import { callGemini, AiUnavailableError, AI_ERROR_MESSAGES, parseJsonFromText } from './geminiService.js';

/**
 * Provider abstraction for the AI Project Builder.
 *
 * The portfolio-writing features use Gemini directly through `geminiService`
 * and the portfolio key. The project builder needs larger outputs and, on some
 * deployments, a different provider, so it talks to this small interface:
 *
 *   AI_PROVIDER=gemini   (default)  GEMINI_PROJECT_API_KEY / GEMINI_PROJECT_MODEL
 *   AI_PROVIDER=openai              OPENAI_API_KEY / AI_MODEL / OPENAI_BASE_URL
 *
 * Both paths return `{ text, model, provider, finishReason }` and throw
 * `AiUnavailableError` with a stable code. No key is ever sent to the browser
 * and no provider is emulated: if neither is configured the API returns 503.
 */

export const aiProviderName = () => env.ai.provider;

export const projectModel = () => {
  if (env.ai.provider === 'openai') return env.ai.model || 'gpt-4o-mini';
  return env.ai.geminiModel;
};

export const projectModelEnvName = () =>
  env.ai.provider === 'openai' ? 'AI_MODEL' : 'GEMINI_PROJECT_MODEL';

export const isProjectAiConfigured = () => {
  if (env.ai.provider === 'openai') return Boolean(env.ai.openaiApiKey);
  return Boolean(env.ai.geminiApiKey);
};

export const AI_PROJECT_ERRORS = {
  ...AI_ERROR_MESSAGES,
  NOT_CONFIGURED:
    'AI project generation is not configured on this server. Add GEMINI_PROJECT_API_KEY to the backend environment (or set AI_PROVIDER=openai and OPENAI_API_KEY).',
  BAD_RESPONSE: 'The AI returned a project that could not be used. Try generating again.',
  INCOMPLETE_PROJECT:
    'The AI did not finish every file in the project manifest. Nothing partial was saved and the credit was returned — try again.',
};

const RETRYABLE_CODES = new Set(['RATE', 'UNAVAILABLE', 'TIMEOUT']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

const mapOpenAiError = (status, message, model) => {
  const detail = String(message || '');
  if (status === 401) {
    return new AiUnavailableError('INVALID_KEY', 'The configured OpenAI-compatible API key was rejected. Check OPENAI_API_KEY on the server.', undefined, {
      providerStatus: status,
      provider: 'openai',
    });
  }
  if (status === 403) {
    return new AiUnavailableError(
      'PERMISSION',
      'The AI provider rejected this request (403). Check that the key has access to the configured model.',
      undefined,
      { providerStatus: status, provider: 'openai' }
    );
  }
  if (status === 429) {
    const quota = /quota|billing|insufficient/i.test(detail);
    return new AiUnavailableError(
      quota ? 'QUOTA' : 'RATE',
      quota
        ? 'The AI provider account has no quota or credit left. Add billing or use another key.'
        : 'The AI provider is rate-limiting requests. Wait a few seconds and try again.',
      undefined,
      { providerStatus: status, provider: 'openai' }
    );
  }
  if (status === 404) {
    return new AiUnavailableError(
      'MODEL_NOT_FOUND',
      `The configured AI model (${model}) is not available to this API key. Set ${projectModelEnvName()} to a supported model.`,
      undefined,
      { providerStatus: status, provider: 'openai' }
    );
  }
  if (status >= 500) {
    return new AiUnavailableError('UNAVAILABLE', AI_PROJECT_ERRORS.UNAVAILABLE, undefined, {
      providerStatus: status,
      provider: 'openai',
    });
  }
  return new AiUnavailableError(
    'BAD_RESPONSE',
    detail ? `The AI provider rejected the request: ${detail.slice(0, 280)}` : AI_PROJECT_ERRORS.BAD_RESPONSE,
    undefined,
    { providerStatus: status, provider: 'openai' }
  );
};

const callOpenAiCompatible = async ({ prompt, system, json, temperature, maxOutputTokens, timeoutMs, stage }) => {
  if (!env.ai.openaiApiKey) throw new AiUnavailableError('NOT_CONFIGURED', AI_PROJECT_ERRORS.NOT_CONFIGURED);

  const model = projectModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  let response;
  let raw = '';
  try {
    response = await fetch(`${env.ai.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxOutputTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });
    raw = await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new AiUnavailableError('TIMEOUT', AI_PROJECT_ERRORS.TIMEOUT, undefined, { provider: 'openai', stage });
    }
    const bodyFailure = Boolean(response);
    const code = bodyFailure ? 'BAD_RESPONSE' : 'UNAVAILABLE';
    console.warn(
      `[ai] provider=openai stage=${stage} status=${response?.status || 'network'} code=${code} ` +
        `detail="${String(error?.message || '').replace(/[\r\n]+/g, ' ').slice(0, 180)}"`
    );
    throw new AiUnavailableError(code, AI_PROJECT_ERRORS[code], undefined, {
      providerStatus: response?.status,
      provider: 'openai',
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
    const mapped = mapOpenAiError(response.status, payload?.error?.message, model);
    mapped.stage = stage;
    console.warn(
      `[ai] provider=openai stage=${stage} status=${response.status} model=${model} code=${mapped.code}` +
        (payload?.error?.message ? ` detail="${String(payload.error.message).replace(/[\r\n]+/g, ' ').slice(0, 240)}"` : '')
    );
    throw mapped;
  }

  if (!payload) {
    console.warn(`[ai] provider=openai stage=${stage} status=200 code=BAD_RESPONSE detail="body was not JSON"`);
    throw new AiUnavailableError('BAD_RESPONSE', AI_PROJECT_ERRORS.BAD_RESPONSE, undefined, {
      providerStatus: 200,
      provider: 'openai',
      stage,
    });
  }

  const choice = payload?.choices?.[0];
  const finishReason = choice?.finish_reason || null;
  const text = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';

  if (!text) {
    const code = finishReason === 'length' ? 'TRUNCATED' : 'BAD_RESPONSE';
    console.warn(`[ai] provider=openai stage=${stage} status=200 code=${code} finish=${finishReason || 'none'}`);
    throw new AiUnavailableError(code, AI_PROJECT_ERRORS[code] || AI_PROJECT_ERRORS.BAD_RESPONSE, undefined, {
      providerStatus: 200,
      provider: 'openai',
      stage,
    });
  }

  if (json && finishReason === 'length' && !parseJsonFromText(text)) {
    console.warn(`[ai] provider=openai stage=${stage} status=200 code=TRUNCATED chars=${text.length}`);
    throw new AiUnavailableError('TRUNCATED', AI_PROJECT_ERRORS.TRUNCATED, undefined, {
      providerStatus: 200,
      provider: 'openai',
      stage,
    });
  }

  return {
    text,
    model: payload?.model || model,
    provider: 'openai',
    finishReason,
    truncated: finishReason === 'length',
  };
};

/**
 * One provider call with a bounded retry for transient failures.
 *
 * `deadline` (epoch ms) is the end of the whole generation. Retries never
 * exceed it, and a timeout error is never retried forever.
 */
export async function callAi({
  prompt,
  system,
  json = true,
  temperature = 0.4,
  maxOutputTokens = 4096,
  timeoutMs = env.ai.providerRequestTimeoutMs,
  deadline,
  stage = 'project',
  requestId = '',
  retries = env.ai.providerRetries,
}) {
  if (!isProjectAiConfigured()) {
    throw new AiUnavailableError('NOT_CONFIGURED', AI_PROJECT_ERRORS.NOT_CONFIGURED, undefined, { stage });
  }

  const attempts = Math.max(0, Math.min(3, Number(retries) || 0)) + 1;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const remainingBudget = deadline ? deadline - Date.now() : timeoutMs;
    if (remainingBudget < 5000) {
      throw new AiUnavailableError(
        'TIMEOUT',
        'Project generation ran out of time before the next AI request could start. The credit was returned — try a smaller idea or complexity.',
        undefined,
        { stage }
      );
    }
    const attemptTimeout = Math.max(5000, Math.min(timeoutMs, remainingBudget));

    try {
      if (env.ai.provider === 'openai') {
        return await callOpenAiCompatible({
          prompt,
          system,
          json,
          temperature,
          maxOutputTokens,
          timeoutMs: attemptTimeout,
          stage,
        });
      }

      const { text, model, finishReason, truncated } = await callGemini({
        prompt,
        system,
        json,
        temperature,
        maxOutputTokens,
        model: projectModel(),
        timeoutMs: attemptTimeout,
        apiKey: env.ai.geminiApiKey,
        apiBaseUrl: env.ai.geminiApiBaseUrl,
        thinkingBudget: env.ai.thinkingBudget,
        stage,
      });
      return { text, model, provider: 'gemini', finishReason, truncated };
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AiUnavailableError && RETRYABLE_CODES.has(error.code);
      if (!retryable || attempt === attempts) throw error;

      const retryAfterMs = Number(error.retryAfterSeconds) > 0 ? Number(error.retryAfterSeconds) * 1000 : attempt * 1000;
      const budgetLeft = deadline ? deadline - Date.now() : attemptTimeout;
      if (retryAfterMs + 5000 > budgetLeft) throw error;

      console.warn(
        `[ai] retrying provider=${env.ai.provider} stage=${stage} requestId=${requestId || 'n/a'} ` +
          `attempt=${attempt + 1}/${attempts} code=${error.code} waitMs=${retryAfterMs}`
      );
      await sleep(Math.min(retryAfterMs, 8000));
    }
  }

  throw lastError || new AiUnavailableError('UNAVAILABLE', AI_PROJECT_ERRORS.UNAVAILABLE);
}

export { AiUnavailableError, parseJsonFromText };
