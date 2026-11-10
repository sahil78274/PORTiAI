import dotenv from 'dotenv';

dotenv.config();

const bool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const required = (name, fallback) => {
  const value = process.env[name];
  if (value && value.trim() !== '') return value.trim();
  return fallback;
};

const NODE_ENV = required('NODE_ENV', 'development');
const isProduction = NODE_ENV === 'production';

/** Deployed frontends that must always be able to reach this API. */
const PRODUCTION_CLIENT_URLS = ['https://portiai-frontend.onrender.com'];

/** Local dev servers (Vite dev + `vite preview`). */
const DEVELOPMENT_CLIENT_URLS = ['http://localhost:5173', 'http://localhost:4173'];

const SESSION_SECRET = required('SESSION_SECRET', isProduction ? '' : 'dev-only-insecure-secret-change-me');

if (isProduction && (!SESSION_SECRET || SESSION_SECRET.length < 32)) {
  // Fail fast: never run production with a missing/weak signing secret.
  throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters in production.');
}

export const env = {
  nodeEnv: NODE_ENV,
  isProduction,
  port: Number(required('PORT', '5000')),
  mongoUri: required('MONGODB_URI', ''),
  /**
   * Local development only: when no MONGODB_URI is configured, the server can
   * start a real (embedded) MongoDB server on this machine instead of
   * silently falling back to mock data. Never enabled in production.
   */
  useLocalMongo: bool(process.env.USE_LOCAL_MONGO, false),
  localMongoPath: required('LOCAL_MONGO_PATH', '.data/mongodb'),
  sessionSecret: SESSION_SECRET,
  /**
   * Browser origins allowed to call the API with credentials.
   *
   * `CLIENT_URL` (comma-separated) is the source of truth for extra origins, but
   * the deployed frontend origins are always allowed too: a missing or stale
   * dashboard value used to make every cross-origin request fail in the browser
   * with no visible reason. Local dev servers are added outside production.
   */
  clientUrls: [
    ...new Set([
      ...required('CLIENT_URL', '')
        .split(',')
        .map((value) => value.trim().replace(/\/$/, ''))
        .filter(Boolean),
      ...PRODUCTION_CLIENT_URLS,
      ...(isProduction ? [] : DEVELOPMENT_CLIENT_URLS),
    ]),
  ],
  gemini: {
    /**
     * Portfolio AI key. The older single-key name is still honoured for
     * backwards compatibility, but the Project Builder never uses this key.
     */
    apiKey: required('GEMINI_PORTFOLIO_API_KEY', required('GEMINI_API_KEY', '')),
    model: required('GEMINI_PORTFOLIO_MODEL', required('GEMINI_MODEL', 'gemini-2.5-flash')),
    // Overridable so the request pipeline can be exercised against a local stub
    // in tests, or a regional/proxy endpoint if required.
    apiBaseUrl: required('GEMINI_PORTFOLIO_API_BASE_URL', required('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com')),
    timeoutMs: Number(required('GEMINI_TIMEOUT_MS', '25000')),
    dailyRequestCap: Number(required('AI_DAILY_REQUEST_CAP', '200')),
  },
  /**
   * AI provider abstraction.
   *
   * `gemini` (the default) uses the dedicated Project Builder key. `openai`
   * talks to any OpenAI-compatible chat-completions endpoint, which covers
   * OpenAI, Groq, Together, OpenRouter and local gateways. Keys are read here
   * only and never leave the server.
   *
   * Key separation is intentional: a portfolio key must not silently spend
   * the Project Builder's quota (or vice versa).
   */
  ai: {
    provider: ['gemini', 'openai'].includes(String(process.env.AI_PROVIDER || '').toLowerCase())
      ? String(process.env.AI_PROVIDER).toLowerCase()
      : 'gemini',
    model: required('AI_MODEL', ''),
    openaiApiKey: required('OPENAI_API_KEY', ''),
    openaiBaseUrl: required('OPENAI_BASE_URL', 'https://api.openai.com/v1').replace(/\/$/, ''),
    /** Project Builder key: GEMINI_PROJECT_API_KEY, never the portfolio key. */
    geminiApiKey: required('GEMINI_PROJECT_API_KEY', required('GEMINI_API_KEY', '')),
    geminiModel: required('GEMINI_PROJECT_MODEL', required('GEMINI_MODEL', 'gemini-2.5-flash')),
    geminiApiBaseUrl: required(
      'GEMINI_PROJECT_API_BASE_URL',
      required('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com')
    ),
    /** Timeout for a single provider request (plan or one file batch). */
    providerRequestTimeoutMs: Math.min(
      180000,
      Math.max(10000, Number(required('AI_PROVIDER_TIMEOUT_MS', '75000')) || 75000)
    ),
    /**
     * Overall budget for one generation, including planning, batches and
     * retries. A large full-stack project needs more than one minute, so this
     * is deliberately separate from the per-request timeout.
     */
    projectTimeoutMs: Math.min(
      600000,
      Math.max(30000, Number(required('AI_PROJECT_TIMEOUT_MS', '240000')) || 240000)
    ),
    /**
     * Gemini 2.5 spends output budget on hidden thinking by default. 0 gives
     * the JSON/file output the full maxOutputTokens budget. Set -1 to keep the
     * provider default, or a positive number to allow that much thinking.
     */
    thinkingBudget: Number(required('GEMINI_PROJECT_THINKING_BUDGET', '0')),
    /** One retry for transient provider failures (network/429/5xx). */
    providerRetries: Math.min(3, Math.max(0, Number(required('AI_PROVIDER_RETRIES', '1')) || 0)),
    /** Project-builder generation limits (AI cost control). */
    projectCreditsMonthly: Math.max(1, Number(required('AI_PROJECT_CREDITS_MONTHLY', '20')) || 20),
  },
  /**
   * Razorpay configuration.
   *
   * `keyId` is public and is handed to the browser checkout. `keySecret` and
   * `webhookSecret` are used only for server-to-server calls and signature
   * verification, and are never included in any API response.
   */
  razorpay: {
    keyId: required('RAZORPAY_KEY_ID', ''),
    keySecret: required('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: required('RAZORPAY_WEBHOOK_SECRET', ''),
    /** Overridable for tests; production always uses the real API. */
    apiBaseUrl: required('RAZORPAY_API_BASE_URL', 'https://api.razorpay.com').replace(/\/$/, ''),
    /** Existing plan ids, if the account already has them provisioned. */
    planIdMonthly: required('RAZORPAY_PLAN_ID_MONTHLY', ''),
    planIdYearly: required('RAZORPAY_PLAN_ID_YEARLY', ''),
    monthlyTotalCount: Math.max(1, Number(required('RAZORPAY_MONTHLY_TOTAL_COUNT', '120')) || 120),
    yearlyTotalCount: Math.max(1, Number(required('RAZORPAY_YEARLY_TOTAL_COUNT', '20')) || 20),
  },
  /** Email addresses that always see the admin panel (comma separated). */
  adminEmails: required('ADMIN_EMAILS', '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  cookieName: 'portiai_session',
  sessionDays: Number(required('SESSION_DAYS', '7')),
  /**
   * Billing is optional.
   *
   * - `webhookSecret` enables the signed provider callback that activates a
   *   plan after a real payment (POST /api/subscription/webhook).
   * - `checkoutUrlMonthly` / `checkoutUrlYearly` point at the provider's hosted
   *   checkout. When set, POST /api/subscription/checkout returns that URL; the
   *   plan is still activated only by the webhook above.
   * - `devUpgrade` is a development-only convenience that lets the signed-in
   *   user activate Premium without a payment provider so the unlock flow can be
   *   tested end to end. It is force-disabled when NODE_ENV=production.
   *
   * Nothing here is ever exposed to the browser other than a boolean saying
   * whether each path is available. No price, secret or plan can be set from
   * the client.
   */
  billing: {
    webhookSecret: required('BILLING_WEBHOOK_SECRET', ''),
    checkoutUrlMonthly: required('BILLING_CHECKOUT_URL_MONTHLY', ''),
    checkoutUrlYearly: required('BILLING_CHECKOUT_URL_YEARLY', ''),
  },
};

/**
 * Development-only self-service upgrade switch.
 *
 * Read at call time (not at import) so tests and local runs can toggle it, and
 * hard-disabled in production no matter what the environment says.
 */
export const isDevUpgradeEnabled = () => {
  if (env.isProduction) return false;
  return !['0', 'false', 'off', 'no'].includes(String(process.env.BILLING_DEV_UPGRADE ?? 'true').toLowerCase());
};

/** True when a hosted checkout URL exists for either interval. */
export const isCheckoutConfigured = () =>
  Boolean(env.billing.checkoutUrlMonthly || env.billing.checkoutUrlYearly);

export const checkoutUrlFor = (interval) =>
  (interval === 'yearly' ? env.billing.checkoutUrlYearly : env.billing.checkoutUrlMonthly) || '';

export const isGeminiConfigured = () => Boolean(env.gemini.apiKey);

/** True when Razorpay can be used for server-to-server calls. */
export const isRazorpayConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

/** True when Razorpay webhook signatures can be verified. */
export const isRazorpayWebhookConfigured = () => Boolean(env.razorpay.webhookSecret);

/** True when an email address has been granted admin access. */
export const isAdminEmail = (email) =>
  Boolean(email) && env.adminEmails.includes(String(email).trim().toLowerCase());
