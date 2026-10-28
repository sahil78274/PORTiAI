/**
 * Single fetch wrapper for the PortiAI API.
 *
 * - `credentials: 'include'` so the HTTP-only session cookie is sent.
 * - Errors are converted into ApiError instances with the server's message,
 *   code and per-field details, so forms can show useful feedback.
 */

/**
 * Resolves `VITE_API_BASE_URL` into the base every request is built from.
 *
 * Vite inlines the variable at build time, so a typo in the hosting dashboard
 * (or a missing variable) ships a broken URL into the bundle. This normalises
 * the common mistakes instead of failing silently:
 *
 *   https://api.example.com            → https://api.example.com/api
 *   https://api.example.com/api/       → https://api.example.com/api
 *   https://api.example.com/api/api    → https://api.example.com/api
 *   " https://api.example.com/api "    → https://api.example.com/api
 *   http://… on an https page          → https://… (mixed content is blocked)
 *   unset / empty                      → /api (same-origin; needs a proxy)
 */
export const normaliseApiBaseUrl = (rawValue, { protocol } = {}) => {
  let value = typeof rawValue === 'string' ? rawValue.trim().replace(/^["']|["']$/g, '').trim() : '';

  if (!value) return '/api';

  // A bare host ("api.example.com/api") would otherwise be treated as a path
  // relative to the frontend origin, so every request would 404 there.
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) {
    value = `https://${value}`;
  }

  // Drop trailing slashes, then collapse a repeated /api/api… suffix.
  value = value.replace(/\/+$/, '');
  value = value.replace(/(?:\/api)+$/i, '/api');

  if (!/\/api$/i.test(value)) {
    value = `${value}/api`;
  }

  // An https page cannot call http:// — the browser blocks it outright, which
  // surfaces as a generic "could not reach the server" error. Loopback hosts are
  // exempt so a local build can still talk to a local API.
  const pageProtocol = protocol ?? (typeof window !== 'undefined' ? window.location?.protocol : undefined);
  const isLoopback = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(value);
  if (pageProtocol === 'https:' && /^http:\/\//i.test(value) && !isLoopback) {
    value = value.replace(/^http:\/\//i, 'https://');
  }

  return value;
};

const BASE_URL = normaliseApiBaseUrl(import.meta.env?.VITE_API_BASE_URL);

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details, retryAfterSeconds } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request(path, { method = 'GET', body, signal, query } = {}) {
  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    // The URL itself is included because a CORS rejection, a mixed-content
    // block and a wrong host all look identical to `fetch`.
    console.error(`[api] ${method} ${url} failed before a response was received`, error);
    throw new ApiError(
      `Could not reach the PortiAI server at ${url}. Check that the API is running, that this origin is allowed by the API's CLIENT_URL setting, and that VITE_API_BASE_URL points at it.`,
      { code: 'NETWORK_ERROR' }
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiError(error.message || `Request failed (${response.status}).`, {
      status: response.status,
      code: error.code || 'REQUEST_FAILED',
      details: error.details,
      retryAfterSeconds: error.retryAfterSeconds,
    });
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, body, options) => request(path, { ...options, method: 'DELETE', body }),
};

export const apiBaseUrl = BASE_URL;
