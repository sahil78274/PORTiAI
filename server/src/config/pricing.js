/**
 * Premium pricing — the single source of truth for every price shown anywhere
 * in PortiAI (the pricing page, the Premium page, the upgrade dialog, Razorpay
 * orders/subscriptions and the admin panel).
 *
 * Published plans
 * ---------------
 *   Monthly  ₹9 for the first month, then ₹299 / month (recurring)
 *   Yearly   ₹3,050 / year   (₹3,588 at the monthly rate — 15% saving)
 *
 * Every amount is in rupees. The browser can never supply an amount: Razorpay
 * orders and subscriptions are always created from these server-side values.
 *
 * Environment overrides exist for sandbox testing only and are intentionally
 * explicit:
 *
 *   PREMIUM_PRICE_INTRO=9
 *   PREMIUM_PRICE_MONTHLY=299
 *   PREMIUM_PRICE_YEARLY=3050
 *   PREMIUM_PRICE_YEARLY_ORIGINAL=3588
 *   PREMIUM_CURRENCY=INR
 *
 * `source` is `"env"` when the amounts came from the environment and `"plan"`
 * when the published defaults are in use. Both are confirmed prices.
 */

/** Published amounts. */
const PLAN_AMOUNTS = {
  intro: 9,
  monthly: 299,
  yearly: 3050,
  yearlyOriginal: 3588,
};

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const readAmount = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || String(raw).trim() === '') return { value: fallback, fromEnv: false };
  const value = Number(String(raw).trim());
  if (!Number.isFinite(value) || value < 0) return { value: fallback, fromEnv: false };
  return { value: Math.round(value), fromEnv: true };
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

/** Amount in the smallest currency unit (paise for INR), as Razorpay expects. */
export const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

/**
 * Product-wide price configuration.
 *
 * `monthly.amount` is the recurring amount from the second month onwards and
 * `monthly.introAmount` is the one-time first-month price. `yearly.amount` is
 * the whole-year total, so it is directly comparable with `monthly.amount * 12`.
 */
export const getPricing = () => {
  const currency = readCurrency();
  const intro = readAmount('PREMIUM_PRICE_INTRO', PLAN_AMOUNTS.intro);
  const monthly = readAmount('PREMIUM_PRICE_MONTHLY', PLAN_AMOUNTS.monthly);
  const yearly = readAmount('PREMIUM_PRICE_YEARLY', PLAN_AMOUNTS.yearly);
  const yearlyOriginal = readAmount('PREMIUM_PRICE_YEARLY_ORIGINAL', PLAN_AMOUNTS.yearlyOriginal);

  const fromEnv = intro.fromEnv || monthly.fromEnv || yearly.fromEnv || yearlyOriginal.fromEnv;

  const introAmount = intro.value;
  const monthlyAmount = monthly.value;
  const yearlyAmount = yearly.value;
  // The comparison price is always 12 × the recurring monthly amount; the
  // published ₹3,588 equals 12 × ₹299 exactly.
  const fullYearAtMonthlyRate = Math.max(yearlyOriginal.value, monthlyAmount * 12);
  const saving = Math.max(0, fullYearAtMonthlyRate - yearlyAmount);
  const savingPercent = fullYearAtMonthlyRate > 0 ? Math.round((saving / fullYearAtMonthlyRate) * 100) : 0;

  return {
    plan: 'premium',
    name: 'Premium',
    currency,
    currencySymbol: CURRENCY_SYMBOLS[currency] || '₹',
    /** `env` when amounts were overridden, `plan` for the published prices. */
    source: fromEnv ? 'env' : 'plan',
    /** Published prices are real prices, not placeholders. */
    confirmed: true,
    /** Kept for backwards compatibility with older clients; never shown now. */
    note: null,
    intro: {
      amount: introAmount,
      display: formatAmount(introAmount, currency),
      /** The introductory price applies to the first billing period only. */
      appliesTo: 'first month',
      label: 'First month',
    },
    monthly: {
      interval: 'monthly',
      months: 1,
      /** Recurring amount, charged from month two. */
      amount: monthlyAmount,
      display: formatAmount(monthlyAmount, currency),
      recurring: true,
      /** One-time first-month amount. */
      introAmount,
      introDisplay: formatAmount(introAmount, currency),
      period: 'month',
      cadenceLabel: 'per month',
      /** Wording reused by every disclosure in the UI. */
      disclosure: `First month ${formatAmount(introAmount, currency)}, then ${formatAmount(
        monthlyAmount,
        currency
      )} every month until you cancel.`,
    },
    yearly: {
      interval: 'yearly',
      months: 12,
      amount: yearlyAmount,
      display: formatAmount(yearlyAmount, currency),
      recurring: true,
      period: 'year',
      cadenceLabel: 'per year',
      originalAmount: fullYearAtMonthlyRate,
      originalDisplay: formatAmount(fullYearAtMonthlyRate, currency),
      fullYearAtMonthlyRate: formatAmount(fullYearAtMonthlyRate, currency),
      saving: formatAmount(saving, currency),
      savingAmount: saving,
      savingPercent,
      disclosure: `${formatAmount(yearlyAmount, currency)} per year (${formatAmount(
        fullYearAtMonthlyRate,
        currency
      )} at the monthly rate), renewed every year until you cancel.`,
    },
    /** True when the published introductory offer has not been used. */
    introOffer: {
      enabled: introAmount < monthlyAmount,
      amount: introAmount,
      display: formatAmount(introAmount, currency),
      recurringAmount: monthlyAmount,
      recurringDisplay: formatAmount(monthlyAmount, currency),
    },
  };
};

/** Monthly / yearly amounts keyed by interval, used when activating a plan. */
export const priceForInterval = (interval) => {
  const pricing = getPricing();
  return interval === 'yearly' ? pricing.yearly : pricing.monthly;
};

export { formatAmount };
