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
  clientUrls: required('CLIENT_URL', 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean),
  gemini: {
    apiKey: required('GEMINI_API_KEY', ''),
    model: required('GEMINI_MODEL', 'gemini-2.5-flash'),
    // Overridable so the request pipeline can be exercised against a local stub
    // in tests, or a regional/proxy endpoint if required.
    apiBaseUrl: required('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com'),
    timeoutMs: Number(required('GEMINI_TIMEOUT_MS', '25000')),
    dailyRequestCap: Number(required('AI_DAILY_REQUEST_CAP', '200')),
  },
  cookieName: 'portiai_session',
  sessionDays: Number(required('SESSION_DAYS', '7')),
};

export const isGeminiConfigured = () => Boolean(env.gemini.apiKey);
