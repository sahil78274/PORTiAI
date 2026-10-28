/**
 * Premium pricing — the single source of truth for every price shown anywhere
 * in PortiAI (the Premium page, the upgrade dialog and the marketing copy).
 *
 * CONFIGURE BEFORE LAUNCH
 * -----------------------
 * No price was configured in this repository, so the amounts below are
 * **indicative defaults** and are reported with `"source": "default"` so the UI
 * can label them honestly. Set the real amounts in `server/.env`:
 *
 *   PREMIUM_PRICE_MONTHLY=499
 *   PREMIUM_PRICE_YEARLY=4999
 *   PREMIUM_CURRENCY=INR
 *
 * When both amounts come from the environment, `source` becomes `"env"` and the
 * "indicative price" note disappears from the interface.
 *
 * The amounts are only ever read by the API. The browser cannot change them.
 */

/** Indicative amounts used until the environment provides real ones. */
const FALLBACK_AMOUNTS = { monthly: 199, yearly: 1999 };

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const readAmount = (name) => {
  const raw = process.env[name];
  if (raw === undefined || String(raw).trim() === '') return null;
  const value = Number(String(raw).trim());
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
};

const readCurrency = () => {
  const raw = String(process.env.PREMIUM_CURRENCY || 'INR').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : 'INR';
};

const formatAmount = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency] || ''}${amount}`;
  }
};

/**
 * Product-wide price configuration.
 *
 * `monthly` and `yearly` are totals for their whole period (not per month), so
 * `yearly.amount` can be compared with `monthly.amount * 12`.
 */
export const getPricing = () => {
  const currency = readCurrency();
  const envMonthly = readAmount('PREMIUM_PRICE_MONTHLY');
  const envYearly = readAmount('PREMIUM_PRICE_YEARLY');

  const monthlyAmount = envMonthly ?? FALLBACK_AMOUNTS.monthly;
  const yearlyAmount = envYearly ?? FALLBACK_AMOUNTS.yearly;
  const source = envMonthly !== null && envYearly !== null ? 'env' : 'default';

  const fullYearAtMonthlyRate = monthlyAmount * 12;
  const saving = Math.max(0, fullYearAtMonthlyRate - yearlyAmount);
  const savingPercent = fullYearAtMonthlyRate > 0 ? Math.round((saving / fullYearAtMonthlyRate) * 100) : 0;

  return {
    plan: 'premium',
    name: 'Premium',
    currency,
    currencySymbol: CURRENCY_SYMBOLS[currency] || '',
    /** `env` when the amounts were configured, `default` for the indicative ones. */
    source,
    /** True only when real amounts were supplied by the environment. */
    confirmed: source === 'env',
    monthly: {
      interval: 'monthly',
      months: 1,
      amount: monthlyAmount,
      display: formatAmount(monthlyAmount, currency),
      period: 'month',
      cadenceLabel: 'per month',
    },
    yearly: {
      interval: 'yearly',
      months: 12,
      amount: yearlyAmount,
      display: formatAmount(yearlyAmount, currency),
      period: 'year',
      cadenceLabel: 'per year',
      fullYearAtMonthlyRate: formatAmount(fullYearAtMonthlyRate, currency),
      saving: formatAmount(saving, currency),
      savingAmount: saving,
      savingPercent,
    },
    /** Shown next to the price while the defaults are still in use. */
    note:
      source === 'env'
        ? null
        : 'Indicative price — set PREMIUM_PRICE_MONTHLY and PREMIUM_PRICE_YEARLY on the server before launch.',
  };
};

/** Monthly / yearly amounts keyed by interval, used when activating a plan. */
export const priceForInterval = (interval) => {
  const pricing = getPricing();
  return interval === 'yearly' ? pricing.yearly : pricing.monthly;
};
