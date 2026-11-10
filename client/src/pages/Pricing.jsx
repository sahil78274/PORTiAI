import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  Loader2,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePricing from '../hooks/usePricing.js';
import useCheckout from '../hooks/useCheckout.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { TEMPLATE_COUNT } from '../data/templateCatalogue.js';

const STEP_LABELS = {
  starting: 'Preparing a secure payment…',
  paying: 'Waiting for Razorpay…',
  verifying: 'Verifying the payment on the PortiAI server…',
  authorising: 'Authorising recurring billing…',
  done: 'Done',
};

const FAQ = [
  {
    q: 'How does the ₹9 first month work?',
    a: 'Your first month is a one-time ₹9 payment. Right after it succeeds, Razorpay opens a second secure window where you authorise the recurring ₹299/month mandate. That mandate starts only when your ₹9 month ends — you are never charged ₹299 for the first month.',
  },
  {
    q: 'When am I charged again?',
    a: 'Monthly: ₹299 on the same date each month, starting after your first month. Yearly: ₹3,050 once a year. Razorpay sends a reminder before each automatic charge, and you can cancel any time from Billing.',
  },
  {
    q: 'What happens when I cancel?',
    a: 'Cancelling stops future renewals. Your Premium access continues to the end of the period you already paid for — the billing page shows the exact date. You are not refunded for unused days, and your portfolios stay published.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Card, UPI and bank details are entered on Razorpay’s secure checkout and never reach PortiAI. Our server only receives payment identifiers and verifies Razorpay’s cryptographic signature before Premium is activated.',
  },
  {
    q: 'What if a renewal payment fails?',
    a: 'Razorpay retries failed renewals. Your Premium stays active until the paid period ends. If every retry fails, the subscription ends and Premium features lock — nothing is deleted, and you can subscribe again at any time.',
  },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function Pricing() {
  const { user, isPremium, subscription, refreshSubscription } = useAuth();
  const { plans, pricing, billing, loading, error: pricingError, refresh: refreshPricing } = usePricing();
  const { purchase, busy, step, error: checkoutError, mandateError, setError } = useCheckout();
  const toast = useToast();

  const [interval, setInterval] = useState('monthly');
  const [authorized, setAuthorized] = useState(false);
  const [devBusy, setDevBusy] = useState(false);

  const monthlyPlan = useMemo(() => plans.find((plan) => plan.id === 'monthly'), [plans]);
  const yearlyPlan = useMemo(() => plans.find((plan) => plan.id === 'yearly'), [plans]);
  const freePlan = useMemo(() => plans.find((plan) => plan.id === 'free'), [plans]);

  const paymentReady = Boolean(billing?.razorpayConfigured);
  const devReady = billing?.upgradePath === 'development';
  const selected = interval === 'yearly' ? yearlyPlan : monthlyPlan;
  const currentInterval = subscription?.interval;
  const isCurrentPlan = isPremium && currentInterval === interval;

  useEffect(() => {
    setAuthorized(false);
  }, [interval]);

  useEffect(() => {
    if (mandateError) {
      toast.info('First month active', { description: mandateError, duration: 9000 });
    }
  }, [mandateError, toast]);

  const start = async () => {
    setError('');
    if (!authorized) {
      toast.info('Please confirm the recurring billing terms first.');
      return;
    }
    if (!paymentReady) {
      if (devReady) {
        setDevBusy(true);
        try {
          const result = await subscriptionService.checkout(interval);
          if (result?.subscription) {
            await refreshSubscription();
            toast.success('Premium activated on this development deployment.', {
              description: 'No payment was taken. Set Razorpay credentials before launch.',
            });
          }
        } catch (error) {
          toast.error(error.message || 'Premium could not be activated.');
        } finally {
          setDevBusy(false);
        }
        return;
      }
      toast.error('Payments are not connected on this deployment yet.', {
        description: 'The PortiAI team needs to add the Razorpay credentials. No payment can be taken here.',
      });
      return;
    }

    const result = await purchase(interval);
    if (result.mode === 'success') {
      const until = result.verified?.entitlements?.premiumUntil;
      toast.success('Premium is active', {
        description: until ? `Your plan runs until ${formatDate(until)}.` : 'All premium features are unlocked.',
      });
    } else if (result.mode === 'already_active' || result.mode === 'already_paid') {
      toast.info('You already have an active subscription.', {
        description: 'Manage it from the billing page.',
      });
    }
  };

  return (
    <div>
      {/* ------------------------------------------------------------- Hero */}
      <section className="hero-glow border-b border-line">
        <div className="container-wide py-12 text-center">
          <p className="eyebrow-accent mx-auto">
            <Sparkles size={11} aria-hidden="true" />
            Pricing
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[40px]">
            Build real projects. Publish a portfolio that gets replies.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-6 text-muted">
            Start free, or unlock all {TEMPLATE_COUNT} templates and the AI Project Builder. Prices are in Indian
            rupees and include taxes where applicable.
          </p>

          {isPremium ? (
            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-md border border-successLine bg-successSoft px-4 py-2 text-[12.5px] text-success">
              <ShieldCheck size={14} aria-hidden="true" />
              <span className="font-semibold">Premium is active</span>
              {subscription?.premiumUntil ? <span>until {formatDate(subscription.premiumUntil)}</span> : null}
              <Link to="/dashboard/billing" className="ml-1 font-medium underline hover:no-underline">
                Manage billing
              </Link>
            </div>
          ) : null}

          {!loading && !paymentReady && !devReady ? (
            <p className="mx-auto mt-6 max-w-xl rounded-md border border-warningLine bg-warningSoft px-4 py-2.5 text-left text-[12px] leading-5 text-warning">
              <AlertTriangle size={13} className="mr-1.5 inline" aria-hidden="true" />
              Online payment is not connected on this deployment yet. The PortiAI team must set{' '}
              <code className="font-mono">RAZORPAY_KEY_ID</code> and <code className="font-mono">RAZORPAY_KEY_SECRET</code>{' '}
              on the API before subscriptions can be purchased. Nothing here will charge you.
            </p>
          ) : null}
        </div>
      </section>

      {/* --------------------------------------------------------- Plan cards */}
      <section className="container-wide py-10">
        {pricingError ? (
          <div className="mx-auto max-w-lg rounded-lg border border-line bg-surface p-4 text-center">
            <p className="text-[13px] font-medium text-ink">Prices could not be loaded</p>
            <p className="mt-1 text-[12px] text-muted">
              Prices are stored on the server so they cannot be tampered with in the browser.
            </p>
            <button type="button" onClick={refreshPricing} className="btn-secondary btn-sm mt-3">
              <RefreshCcw size={12} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Free */}
          <article className="surface-card flex flex-col p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Free</h2>
                <p className="mt-1 text-[12.5px] text-muted">For your first portfolio</p>
              </div>
              {!isPremium ? <span className="badge-neutral">Current</span> : null}
            </div>
            <p className="mt-5 text-[32px] font-semibold leading-none tracking-[-0.03em] text-ink">₹0</p>
            <p className="mt-1 text-[12px] text-faint">free forever</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {(freePlan?.features || [
                'Original free templates',
                'Editor, previews and publishing',
                'Portfolio review and AI writing',
              ]).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  {feature}
                </li>
              ))}
              <li className="flex items-start gap-2 text-[13px] leading-5 text-faint">
                <X size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                AI Project Builder
              </li>
            </ul>
            <Link to={user ? '/dashboard' : '/signup'} className="btn-secondary mt-6 w-full justify-center">
              {user ? 'Open dashboard' : 'Start free'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>

          {/* Monthly */}
          <article className="surface-card relative flex flex-col overflow-hidden border-accent-line p-6 shadow-raised">
            <span className="badge-premium absolute right-5 top-5">Most popular</span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Monthly</h2>
              <p className="mt-1 text-[12.5px] text-muted">Everything, billed monthly</p>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {monthlyPlan?.introDisplay || pricing?.monthly?.introDisplay || '₹9'}
                </p>
                <p className="text-[13px] font-medium text-ink">first month</p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted">
                then{' '}
                <span className="font-semibold text-ink">{monthlyPlan?.display || pricing?.monthly?.display || '₹299'}</span>{' '}
                every month, until you cancel.
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-faint">
                <RefreshCcw size={11} aria-hidden="true" />
                Recurring payment · cancel any time
              </p>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {(monthlyPlan?.features || []).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setInterval('monthly');
                document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`mt-6 w-full justify-center ${interval === 'monthly' && !isCurrentPlan ? 'btn-primary' : 'btn-secondary'}`}
            >
              {isCurrentPlan ? 'Your current plan' : isPremium ? 'Switch to monthly' : 'Choose monthly'}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </article>

          {/* Yearly */}
          <article className="surface-card flex flex-col p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Yearly</h2>
                <p className="mt-1 text-[12.5px] text-muted">Two months cheaper</p>
              </div>
              {yearlyPlan?.savingPercent ? <span className="badge-success">Save {yearlyPlan.savingPercent}%</span> : null}
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
                  {yearlyPlan?.display || pricing?.yearly?.display || '₹3,050'}
                </p>
                <p className="text-[13px] font-medium text-ink">per year</p>
                <p className="text-[13px] text-faint line-through">
                  {yearlyPlan?.originalDisplay || pricing?.yearly?.originalDisplay || '₹3,588'}
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted">
                {yearlyPlan?.saving || pricing?.yearly?.saving || '₹538'} less than paying monthly. One payment a year.
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-faint">
                <RefreshCcw size={11} aria-hidden="true" />
                Renews yearly · cancel any time
              </p>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {(yearlyPlan?.features || []).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setInterval('yearly');
                document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`mt-6 w-full justify-center ${interval === 'yearly' && !isCurrentPlan ? 'btn-primary' : 'btn-secondary'}`}
            >
              {isCurrentPlan ? 'Your current plan' : isPremium ? 'Switch to yearly' : 'Choose yearly'}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </article>
        </div>

        {/* ------------------------------------------------------- Checkout */}
        <div id="checkout" className="mx-auto mt-6 max-w-4xl">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Secure checkout</p>
                <h2 className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                  {selected?.id === 'yearly'
                    ? `PortiAI Premium — yearly at ${selected?.display || '₹3,050'}`
                    : `PortiAI Premium — ${monthlyPlan?.introDisplay || '₹9'} for the first month`}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-medium text-muted">
                <Lock size={12} className="text-success" aria-hidden="true" />
                Razorpay · PCI-DSS
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-canvas p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                  {selected?.id === 'yearly' ? 'Charged today' : 'Charged today'}
                </p>
                <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">
                  {selected?.id === 'yearly'
                    ? selected?.display || pricing?.yearly?.display
                    : monthlyPlan?.introDisplay || pricing?.monthly?.introDisplay}
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">
                  {selected?.id === 'yearly'
                    ? `${pricing?.yearly?.originalDisplay || '₹3,588'} at the monthly rate — you save ${
                        pricing?.yearly?.saving || '₹538'
                      } a year.`
                    : 'One-time introductory payment for your first month.'}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-canvas p-3.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Then</p>
                <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">
                  {selected?.id === 'yearly'
                    ? `${pricing?.yearly?.display || '₹3,050'} / year`
                    : `${pricing?.monthly?.display || '₹299'} / month`}
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">
                  {selected?.id === 'yearly'
                    ? 'Renews automatically every 12 months until cancelled.'
                    : 'Recurring from the second month, charged automatically until cancelled.'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-accent-line bg-accent-soft p-3.5 text-[12px] leading-5 text-inkSoft">
              <p className="flex items-start gap-2">
                <CalendarClock size={14} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-ink">Recurring payment disclosure.</strong>{' '}
                  {interval === 'yearly'
                    ? `You will be charged ${pricing?.yearly?.display || '₹3,050'} now, then ${
                        pricing?.yearly?.display || '₹3,050'
                      } every year until you cancel.`
                    : `You will be charged ${pricing?.monthly?.introDisplay || '₹9'} now for the first month, then ${
                        pricing?.monthly?.display || '₹299'
                      } every month starting after that month, until you cancel.`}{' '}
                  You can cancel any time from Billing and keep access until the end of the paid period.
                </span>
              </p>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface p-3">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-[12px] leading-5 text-inkSoft">
                I authorise PortiAI and Razorpay to charge my payment method{' '}
                {interval === 'yearly'
                  ? `${pricing?.yearly?.display || '₹3,050'} every year`
                  : `${pricing?.monthly?.display || '₹299'} every month from the second month`}{' '}
                until I cancel. I understand this is a recurring subscription.
              </span>
            </label>

            {checkoutError ? (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-dangerLine bg-dangerSoft p-3 text-[12px] leading-5 text-danger" role="alert">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{checkoutError}</p>
              </div>
            ) : null}

            {mandateError ? (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-warningLine bg-warningSoft p-3 text-[12px] leading-5 text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{mandateError}</p>
              </div>
            ) : null}

            {!user ? (
              <Link to="/signup" className="btn-primary mt-4 w-full justify-center">
                Create an account to subscribe
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={busy || devBusy || loading || !authorized || isCurrentPlan}
                className="btn-primary mt-4 w-full justify-center"
              >
                {busy || devBusy ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard size={15} aria-hidden="true" />
                )}
                {busy
                  ? STEP_LABELS[step] || 'Starting secure checkout…'
                  : devBusy
                    ? 'Activating…'
                    : isCurrentPlan
                      ? 'Your current plan'
                      : !authorized
                        ? 'Confirm the recurring terms to continue'
                        : paymentReady
                          ? `Pay ${interval === 'yearly' ? pricing?.yearly?.display || '₹3,050' : pricing?.monthly?.introDisplay || '₹9'} with Razorpay`
                          : devReady
                            ? 'Activate Premium (development only)'
                            : 'Payments not configured'}
              </button>
            )}

            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10.5px] leading-4 text-faint">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={11} aria-hidden="true" />
                Signature verified on the server
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck size={11} aria-hidden="true" />
                Never activated from the browser
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock size={11} aria-hidden="true" />
                No card details stored by PortiAI
              </span>
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------- Comparison */}
        <div className="mt-10 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
            <caption className="sr-only">Free, monthly and yearly plan comparison</caption>
            <thead className="bg-canvasAlt text-[11px] uppercase tracking-[0.1em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Included</th>
                <th scope="col" className="px-4 py-3 font-semibold">Free</th>
                <th scope="col" className="px-4 py-3 font-semibold">Monthly</th>
                <th scope="col" className="px-4 py-3 font-semibold">Yearly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {[
                ['Templates', 'Free collection', `All ${TEMPLATE_COUNT}`, `All ${TEMPLATE_COUNT}`],
                ['AI Project Builder', false, 'Monthly credits', 'Monthly credits'],
                ['Download projects as ZIP', false, true, true],
                ['Project screenshots in every template', false, true, true],
                ['Portfolio editor, previews and publishing', true, true, true],
                ['Portfolio review (100-point rubric)', true, true, true],
                ['AI writing assistant', true, true, true],
                ['Public portfolio and blog', true, true, true],
                ['Price', '₹0', `₹9 first month, then ₹299/mo`, `₹3,050/year`],
              ].map(([feature, free, monthly, yearly]) => (
                <tr key={feature}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-ink">{feature}</th>
                  {[free, monthly, yearly].map((value, index) => (
                    <td key={index} className="px-4 py-3 text-muted">
                      {value === true ? (
                        <Check size={14} className="text-success" aria-label="Included" />
                      ) : value === false ? (
                        <X size={14} className="text-faint" aria-label="Not included" />
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------------ FAQ */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="surface-card p-5">
              <h3 className="text-[13.5px] font-semibold text-ink">{item.q}</h3>
              <p className="mt-2 text-[12.5px] leading-6 text-muted">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-6">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Questions about billing?</h2>
            <p className="mt-1 text-[13px] text-muted">
              Your subscription, receipts and cancellation are all on one page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/premium" className="btn-secondary">
              Premium features
            </Link>
            <Link to={user ? '/dashboard/billing' : '/login'} className="btn-primary">
              {user ? 'Manage billing' : 'Sign in to billing'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
