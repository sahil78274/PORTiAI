import { env } from '../config/env.js';
import { callGemini, AiUnavailableError, isAiEnabled, AI_ERROR_MESSAGES } from './geminiService.js';

/**
 * Provider abstraction for the AI Project Builder.
 *
 * The existing portfolio-writing features use Gemini directly through
 * `geminiService`. The project builder needs larger outputs and, on some
 * deployments, a different provider, so it talks to this small interface:
 *
 *   AI_PROVIDER=gemini   (default)  uses GEMINI_API_KEY / GEMINI_MODEL
 *   AI_PROVIDER=openai              uses OPENAI_API_KEY / AI_MODEL / OPENAI_BASE_URL
 *
 * Both paths return `{ text, model, provider }` and throw `AiUnavailableError`
 * with a stable code. No key is ever sent to the browser and no provider is
 * emulated: if neither is configured the API returns 503.
 */

export const aiProviderName = () => env.ai.provider;

export const projectModel = () =>
  env.ai.model || (env.ai.provider === 'openai' ? 'gpt-4o-mini' : env.gemini.model);

export const isProjectAiConfigured = () => {
  if (env.ai.provider === 'openai') return Boolean(env.ai.openaiApiKey);
  return Boolean(env.ai.geminiApiKey);
};

export const AI_PROJECT_ERRORS = {
  ...AI_ERROR_MESSAGES,
  NOT_CONFIGURED:
    'AI project generation is not configured on this server. Add GEMINI_API_KEY (or set AI_PROVIDER=openai and OPENAI_API_KEY) to the backend environment.',
  BAD_RESPONSE: 'The AI returned a project that could not be used. Try generating again.',
};

const mapOpenAiError = (status, message) => {
  if (status === 401 || status === 403) {
    return new AiUnavailableError('INVALID_KEY', AI_PROJECT_ERRORS.INVALID_KEY);
  }
  if (status === 429) {
    return new AiUnavailableError('RATE', AI_PROJECT_ERRORS.RATE);
  }
  if (status === 404) {
    return new AiUnavailableError(
      'UNAVAILABLE',
      `The configured AI model (${projectModel()}) is not available to this API key. Set AI_MODEL to a model you can use.`
    );
  }
  if (/quota|billing/i.test(message || '')) {
    return new AiUnavailableError('QUOTA', AI_PROJECT_ERRORS.QUOTA);
  }
  if (status >= 500) return new AiUnavailableError('UNAVAILABLE', AI_PROJECT_ERRORS.UNAVAILABLE);
  return new AiUnavailableError('BAD_RESPONSE', message || AI_PROJECT_ERRORS.BAD_RESPONSE);
};

const callOpenAiCompatible = async ({ prompt, system, temperature, maxOutputTokens, timeoutMs }) => {
  if (!env.ai.openaiApiKey) throw new AiUnavailableError('NOT_CONFIGURED', AI_PROJECT_ERRORS.NOT_CONFIGURED);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`${env.ai.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: projectModel(),
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxOutputTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') throw new AiUnavailableError('TIMEOUT', AI_PROJECT_ERRORS.TIMEOUT);
    throw new AiUnavailableError('UNAVAILABLE', AI_PROJECT_ERRORS.UNAVAILABLE);
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
    throw mapOpenAiError(response.status, payload?.error?.message);
  }

  const text = payload?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiUnavailableError('BAD_RESPONSE', AI_PROJECT_ERRORS.BAD_RESPONSE);

  return { text, model: payload?.model || projectModel(), provider: 'openai' };
};

/**
 * One provider call. JSON mode is used for every project-builder request, so
 * the result is always parsed with `parseJsonFromText` by the caller.
 */
export async function callAi({
  prompt,
  system,
  json = true,
  temperature = 0.4,
  maxOutputTokens = 4096,
  timeoutMs = env.ai.projectTimeoutMs,
}) {
  if (!isProjectAiConfigured()) {
    throw new AiUnavailableError('NOT_CONFIGURED', AI_PROJECT_ERRORS.NOT_CONFIGURED);
  }

  if (env.ai.provider === 'openai') {
    return callOpenAiCompatible({ prompt, system, temperature, maxOutputTokens, timeoutMs });
  }

  const { text, model } = await callGemini({
  prompt,
  system,
  json,
  temperature,
  maxOutputTokens,
  model: projectModel(),
  timeoutMs,
  apiKey: env.ai.geminiApiKey,
});
  return { text, model, provider: 'gemini' };
}

export { AiUnavailableError, isAiEnabled };
