import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../services/api.js';
import usePricing from '../hooks/usePricing.js';
import { TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT, FREE_TEMPLATE_COUNT, TEMPLATE_LAYOUTS } from '../data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../data/templateStyles.js';

const COMPARISON = [
  { feature: 'Original templates', free: `${FREE_TEMPLATE_COUNT} layouts`, premium: `All ${TEMPLATE_COUNT}` },
  { feature: 'Premium catalogue', free: false, premium: `${PREMIUM_TEMPLATE_COUNT} designs` },
  { feature: 'Layouts × styles', free: 'Six originals', premium: `${TEMPLATE_LAYOUTS.length} × ${TEMPLATE_STYLES.length}` },
  { feature: 'Live editor, previews, publishing', free: true, premium: true },
  { feature: 'Portfolio review (100-point rubric)', free: true, premium: true },
  { feature: 'AI writing assistant', free: true, premium: true },
  { feature: 'Public blog', free: true, premium: true },
  { feature: 'Light and dark themes', free: true, premium: true },
];

const FAQ = [
  {
    q: 'How does PortiAI decide if I have Premium?',
    a: 'The API reads your plan from the database on every premium action. The template gallery asks the server for your entitlement and updates automatically when it changes. No browser flag can unlock a premium template.',
  },
  {
    q: 'What happens if I downgrade?',
    a: 'Existing portfolios keep rendering the design you chose. New portfolios and design changes require an active Premium plan for premium templates.',
  },
  {
    q: 'How do I buy Premium?',
    a: 'Use the Upgrade to Premium button with the billing period you want. If the deployment has a checkout provider connected, you are sent to its secure payment page and the plan is activated on the server once the payment is confirmed. When no provider is connected, the button explains exactly what has to be configured — it never pretends an upgrade succeeded.',
  },
  {
    q: 'Why does my plan change without a page reload?',
    a: 'Every premium action is checked against the plan stored on your account. After an upgrade the app re-reads your entitlement from the API, and it also refreshes periodically and when the tab regains focus, so the gallery unlocks as soon as the server confirms the plan.',
  },
];

export default function Premium() {
  const { user, subscription, isPremium, refreshSubscription, subscriptionLoading, upgrade } = useAuth();
  const toast = useToast();
  const { pricing, plans, billing: catalogueBilling, loading: pricingLoading, error: pricingError, refresh: refreshPricing } =
    usePricing();

  const [checking, setChecking] = useState(false);
  const [interval, setInterval] = useState('monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  /** Availability comes from the public plans endpoint; context is the fallback. */
  const billing = catalogueBilling || subscription?.billing || {};
  const premiumPlan = plans.find((plan) => plan.id === 'premium') || null;
  const selected = interval === 'yearly' ? pricing?.yearly : pricing?.monthly;
  const checkoutReady = billing.upgradePath === 'checkout';
  const devReady = billing.upgradePath === 'development';

  const check = async () => {
    setChecking(true);
    const next = await refreshSubscription();
    setChecking(false);
    if (next?.isPremium) toast.success('Premium confirmed — the full catalogue is unlocked.');
    else toast.info('Still on the Free plan.', { description: 'Your plan is read from the server on every request.' });
  };

  /**
   * The only upgrade path. The server either hands back a hosted checkout URL,
   * activates the plan in development mode, or refuses with
   * `BILLING_NOT_CONFIGURED` — which is shown here, never swallowed.
   */
  const startUpgrade = async () => {
    setConfigMessage('');
    setUpgrading(true);
    try {
      const result = await upgrade(interval);
      if (result.mode === 'checkout') {
        toast.info('Opening secure checkout…', {
          description: 'Premium activates once the payment provider confirms your payment on the server.',
        });
        window.location.assign(result.url);
        return;
      }
      toast.success('Premium is active — all templates are unlocked.', {
        description: result.subscription?.premiumUntil
          ? `Your plan runs until ${new Date(result.subscription.premiumUntil).toLocaleDateString()}.`
          : 'The catalogue updated without a reload.',
      });
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'BILLING_NOT_CONFIGURED' || error.status === 503)) {
        setConfigMessage(error.message);
      } else {
        toast.error(error.message || 'Could not start the upgrade. Please try again.');
      }
    } finally {
      setUpgrading(false);
    }
  };

  const busy = checking || subscriptionLoading || upgrading || pricingLoading;

  return (
    <div>
      <section className="hero-glow border-b border-line">
        <div className="container-wide py-10 text-center">
          <p className="eyebrow-accent mx-auto">
            <Sparkles size={11} aria-hidden="true" />
            PortiAI Premium
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[34px]">
            Every layout, every style, one account.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-6 text-muted">
            Premium adds the {PREMIUM_TEMPLATE_COUNT}-template premium catalogue to everything you already get for free.
            Entitlement is verified by the PortiAI API — not by the browser.
          </p>

          <div className="mx-auto mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-[12.5px]">
            {user ? (
              isPremium ? (
                <>
                  <ShieldCheck size={14} className="text-success" aria-hidden="true" />
                  <span className="font-medium text-ink">Premium active</span>
                  <span className="text-muted">
                    · verified for {user.email}
                    {subscription?.premiumUntil ? ` until ${new Date(subscription.premiumUntil).toLocaleDateString()}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-muted" aria-hidden="true" />
                  <span className="font-medium text-ink">Free plan</span>
                  <span className="text-muted">· {subscription?.templates?.accessible ?? FREE_TEMPLATE_COUNT} of {TEMPLATE_COUNT} templates available</span>
                </>
              )
            ) : (
              <>
                <Sparkles size={13} className="text-accent" aria-hidden="true" />
                <span className="text-muted">Sign in to check your plan</span>
              </>
            )}
            {user ? (
              <button type="button" onClick={check} disabled={busy} className="ml-1 inline-flex items-center gap-1 font-medium text-accent-hover hover:underline">
                <RefreshCw size={11} className={busy ? 'animate-spin' : ''} aria-hidden="true" />
                Refresh
              </button>
            ) : (
              <Link to="/login" className="ml-1 font-medium text-accent-hover hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">Free</h2>
              <p className="text-[13px] text-muted">Free · forever</p>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-muted">Everything needed to publish a first portfolio.</p>
            <ul className="mt-4 space-y-2">
              {[`${FREE_TEMPLATE_COUNT} original templates`, 'Full editor and live previews', 'Portfolio review and AI writing', 'Public portfolio link and blog'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to={user ? '/dashboard' : '/signup'} className="btn-secondary mt-5 w-full justify-center">
              {user ? 'Open dashboard' : 'Start free'}
            </Link>
          </div>

          <div className="surface-card relative overflow-hidden border-accent-line p-6">
            <span className="absolute right-5 top-5 badge-premium">Premium</span>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">Premium</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted">The complete template catalogue, plus everything in Free.</p>

            {/* ------------------------------------------------- Billing period */}
            {pricing ? (
              <>
                <div className="mt-4 inline-flex items-center gap-0.5 rounded-md border border-line bg-canvas p-0.5" role="group" aria-label="Billing period">
                  {[
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'yearly', label: 'Yearly' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInterval(option.id)}
                      aria-pressed={interval === option.id}
                      className={`rounded px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        interval === option.id ? 'bg-surfaceRaised text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {option.label}
                      {option.id === 'yearly' && pricing.yearly.savingPercent > 0 ? (
                        <span className="ml-1.5 text-[10.5px] font-semibold text-accent">−{pricing.yearly.savingPercent}%</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
                    {selected?.display}
                  </p>
                  <p className="text-[13px] text-muted">{selected?.cadenceLabel}</p>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-faint">{pricing.currency}</span>
                </div>

                <p className="mt-1.5 text-[12px] leading-5 text-muted">
                  {interval === 'yearly'
                    ? `${pricing.yearly.fullYearAtMonthlyRate} paid monthly — you save ${pricing.yearly.saving} per year.`
                    : `Billed every month. Or ${pricing.yearly.display} per year and save ${pricing.yearly.saving}.`}
                </p>
                {!pricing.confirmed && pricing.note ? (
                  <p className="mt-1 text-[11px] leading-4 text-faint">{pricing.note}</p>
                ) : null}
              </>
            ) : pricingError ? (
              <div className="mt-4 rounded-md border border-line bg-canvas p-3">
                <p className="text-[12px] font-medium text-ink">Pricing could not be loaded</p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">
                  The price is stored on the server, so it cannot be shown while the API is unreachable.
                </p>
                <button type="button" onClick={refreshPricing} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover hover:underline">
                  <RefreshCw size={11} aria-hidden="true" />
                  Try again
                </button>
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-muted">Loading price…</p>
            )}

            <ul className="mt-4 space-y-2">
              {(premiumPlan?.features || [
                `All ${TEMPLATE_COUNT} templates`,
                `${TEMPLATE_LAYOUTS.length} layouts × ${TEMPLATE_STYLES.length} visual styles`,
                'New designs as they ship',
                'No per-template purchases',
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            {/* --------------------------------------------------- Plan status */}
            <div className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-[12px] leading-5">
              {isPremium ? (
                <>
                  <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  <p className="text-muted">
                    <span className="font-medium text-ink">Your plan: Premium.</span>{' '}
                    {subscription?.premiumUntil
                      ? `Active until ${new Date(subscription.premiumUntil).toLocaleDateString()}.`
                      : 'Active with no expiry date.'}{' '}
                    All {subscription?.templates?.accessible ?? TEMPLATE_COUNT} templates are unlocked.
                  </p>
                </>
              ) : (
                <>
                  <Lock size={13} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  <p className="text-muted">
                    <span className="font-medium text-ink">Your plan: {user ? subscription?.label || 'Free' : 'not signed in'}.</span>{' '}
                    {user
                      ? `${subscription?.templates?.accessible ?? FREE_TEMPLATE_COUNT} of ${TEMPLATE_COUNT} templates are available.`
                      : 'Sign in to see your plan, or create an account to upgrade.'}
                  </p>
                </>
              )}
            </div>

            {/* ---------------------------------------------------- How it works */}
            <div className="mt-3 rounded-md border border-line bg-canvasAlt p-3.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                <CreditCard size={13} className="text-accent" aria-hidden="true" />
                {checkoutReady ? 'Secure checkout connected' : devReady ? 'Development activation' : 'Checkout not connected'}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                {checkoutReady
                  ? 'Upgrade opens the payment provider’s secure page. Premium is activated on the PortiAI server only after the provider confirms the payment.'
                  : devReady
                    ? 'This development deployment activates Premium on the server as soon as you press Upgrade — no payment is taken. The switch is disabled when NODE_ENV=production.'
                    : 'This deployment has no payment provider, so nothing can be purchased here. Pressing Upgrade shows exactly what the server still needs; the PortiAI team can also provision the plan with scripts/grant-premium.mjs.'}
              </p>
            </div>

            {configMessage ? (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-warningLine bg-warningSoft p-3 text-[12px] leading-5 text-warning" role="alert">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{configMessage}</p>
              </div>
            ) : null}

            {/* ------------------------------------------------------- Actions */}
            {isPremium ? (
              <Link to="/templates" className="btn-primary mt-4 w-full justify-center">
                Browse all templates
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : user ? (
              <button type="button" onClick={startUpgrade} disabled={upgrading || pricingLoading} className="btn-primary mt-4 w-full justify-center">
                {upgrading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                {upgrading ? 'Starting upgrade…' : 'Upgrade to Premium'}
              </button>
            ) : (
              <Link to="/signup" className="btn-primary mt-4 w-full justify-center">
                Create an account to upgrade
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}

            {!isPremium ? (
              <p className="mt-2 text-center text-[11px] leading-4 text-faint">
                Your plan is stored on your PortiAI account and verified by the API — never by the browser.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-[13px]">
            <caption className="sr-only">Free and Premium plan comparison</caption>
            <thead className="bg-canvasAlt text-[11px] uppercase tracking-[0.1em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Feature
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Free
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                    {row.feature}
                  </th>
                  <td className="px-4 py-3 text-muted">
                    {row.free === true ? (
                      <Check size={14} className="text-success" aria-label="Included" />
                    ) : row.free === false ? (
                      <X size={14} className="text-faint" aria-label="Not included" />
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {row.premium === true ? <Check size={14} className="text-accent" aria-label="Included" /> : row.premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FAQ.map((item) => (
            <div key={item.q} className="surface-card p-5">
              <h3 className="text-[13.5px] font-semibold text-ink">{item.q}</h3>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-6">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">Not sure yet? Preview everything.</h2>
            <p className="mt-1 text-[13px] text-muted">Every template can be previewed at three widths before you decide.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/templates" className="btn-secondary">
              Browse templates
            </Link>
            <Link to="/templates?access=free" className="btn-primary">
              Free templates
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
