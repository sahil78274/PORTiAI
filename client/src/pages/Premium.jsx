import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CreditCard, Lock, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
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
    q: 'Can I buy Premium right here?',
    a: 'Checkout is handled outside this environment. Once your subscription is processed, the PortiAI team activates the plan on your account and the gallery unlocks — no new account and no page reload needed.',
  },
];

export default function Premium() {
  const { user, subscription, isPremium, refreshSubscription, subscriptionLoading } = useAuth();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    const next = await refreshSubscription();
    setChecking(false);
    if (next?.isPremium) toast.success('Premium confirmed — the full catalogue is unlocked.');
    else toast.info('Still on the Free plan.', { description: 'Plans are activated server-side after purchase.' });
  };

  const busy = checking || subscriptionLoading;

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
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">Premium</h2>
              <p className="text-[13px] text-muted">Activated per account</p>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-muted">The complete template catalogue, plus everything in Free.</p>
            <ul className="mt-4 space-y-2">
              {[`All ${TEMPLATE_COUNT} templates`, `${TEMPLATE_LAYOUTS.length} layouts × ${TEMPLATE_STYLES.length} visual styles`, 'New designs as they ship', 'No per-template purchases'].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg border border-line bg-canvasAlt p-3.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                <CreditCard size={13} className="text-accent" aria-hidden="true" />
                {subscription?.billing?.providerConfigured ? 'Billing is connected' : 'Arranged with the PortiAI team'}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                {isPremium
                  ? 'Your plan is active. Every template is unlocked.'
                  : 'Tell us which account should get Premium; once it is activated, refresh the status above and the whole catalogue unlocks.'}
              </p>
            </div>
            <Link to={user ? '/templates' : '/signup'} className="btn-primary mt-4 w-full justify-center">
              {isPremium ? 'Browse all templates' : user ? 'Browse the catalogue' : 'Create an account'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
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
