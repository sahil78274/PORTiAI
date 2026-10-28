import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Loader2, Lock, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ApiError } from '../../services/api.js';
import usePricing from '../../hooks/usePricing.js';
import { PREMIUM_TEMPLATE_COUNT, FREE_TEMPLATE_COUNT, TEMPLATE_COUNT } from '../../data/templateCatalogue.js';

/**
 * Upgrade prompt shown when a signed-in (or signed-out) user tries to use a
 * premium template.
 *
 * The plan shown here comes from GET /api/subscription. The "Check status"
 * button re-reads it, which is how an account upgraded elsewhere unlocks the
 * catalogue without a page reload. There is deliberately no "activate" button:
 * the client cannot grant Premium.
 */
export default function PremiumDialog({ template, open, onClose, onBrowseFree }) {
  const { user, subscription, refreshSubscription, subscriptionLoading, isPremium, upgrade } = useAuth();
  const toast = useToast();
  const { pricing, billing: catalogueBilling } = usePricing();
  const [checking, setChecking] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  useEffect(() => {
    if (!open) setConfigMessage('');
  }, [open]);

  useEffect(() => {
    if (open && isPremium) {
      toast.success('Premium is active on your account. All templates are unlocked.');
      onClose?.();
    }
  }, [open, isPremium, onClose, toast]);

  const checkStatus = async () => {
    setChecking(true);
    const next = await refreshSubscription();
    setChecking(false);
    if (next?.isPremium) {
      toast.success('Premium confirmed. Every template is now unlocked.');
    } else {
      toast.info('This account is still on the Free plan.', {
        description: 'Premium is activated server-side once your subscription is processed.',
      });
    }
  };

  const billing = catalogueBilling || subscription?.billing || {};
  const checkoutReady = billing.upgradePath === 'checkout';
  const devReady = billing.upgradePath === 'development';
  const busy = checking || subscriptionLoading || upgrading;

  /**
   * Upgrade straight from the prompt. The plan is only ever granted by the
   * server; when no payment path exists the API answers 503 and that message is
   * shown here instead of a fake success.
   */
  const startUpgrade = async () => {
    setConfigMessage('');
    setUpgrading(true);
    try {
      const result = await upgrade('monthly');
      if (result.mode === 'checkout') {
        toast.info('Opening secure checkout…', {
          description: 'Premium activates once the provider confirms the payment on the server.',
        });
        window.location.assign(result.url);
        return;
      }
      // The `isPremium` effect above closes this dialog once the state updates.
      toast.success('Premium is active — every template is unlocked.');
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'BILLING_NOT_CONFIGURED' || error.status === 503)) {
        setConfigMessage(error.message);
      } else {
        toast.error(error.message || 'Could not start the upgrade.');
      }
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={template ? `Unlock ${template.name}` : 'Unlock the premium catalogue'}
      description={`This design is one of ${PREMIUM_TEMPLATE_COUNT} premium templates.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Keep browsing
          </button>
          <Link to="/premium" className="btn-secondary" onClick={onClose}>
            Compare plans
          </Link>
          {user ? (
            <button type="button" onClick={startUpgrade} disabled={busy} className="btn-primary">
              {upgrading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
              {upgrading ? 'Starting…' : 'Upgrade to Premium'}
            </button>
          ) : (
            <Link to="/signup" className="btn-primary" onClick={onClose}>
              Create a free account
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-line bg-canvasAlt p-3.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-hover">
            <Lock size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">
              {user ? `Signed in as ${user.email}` : 'You are browsing as a guest'}
            </p>
            <p className="mt-0.5 text-[12.5px] leading-5 text-muted">
              {user
                ? `Current plan: ${subscription?.label || 'Free'}. Free accounts keep the ${FREE_TEMPLATE_COUNT} original templates and every editing feature.`
                : `Create a free account to use the ${FREE_TEMPLATE_COUNT} original templates. Premium adds the remaining ${PREMIUM_TEMPLATE_COUNT}.`}
            </p>
          </div>
        </div>

        {pricing ? (
          <div className="flex flex-wrap items-baseline gap-x-2 rounded-md border border-line bg-surface px-3 py-2.5">
            <span className="text-[19px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-nums">
              {pricing.monthly.display}
            </span>
            <span className="text-[12px] text-muted">{pricing.monthly.cadenceLabel}</span>
            <span className="text-[11.5px] text-faint">· or {pricing.yearly.display} per year</span>
            {!pricing.confirmed ? <span className="text-[10.5px] text-faint">(indicative price)</span> : null}
          </div>
        ) : null}

        <ul className="space-y-2">
          {[
            `All ${TEMPLATE_COUNT} templates across ten layouts and ten visual styles`,
            'Every existing feature stays included — editor, previews, review, blog',
            'New templates land in your catalogue as they ship',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
              <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-line bg-surface p-3.5">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            <ShieldCheck size={14} className="text-accent" aria-hidden="true" />
            How Premium is activated
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-muted">
            PortiAI verifies entitlement on the server for every premium template.
            {checkoutReady
              ? ' Upgrade opens the payment provider’s secure page; the plan is activated on the server only after the provider confirms the payment.'
              : devReady
                ? ' This development deployment activates the plan on the server immediately; the switch is disabled in production.'
                : ' No payment provider is connected to this deployment, so upgrades are provisioned by the PortiAI team.'}{' '}
            The browser never grants access.
          </p>
          {configMessage ? (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-warningLine bg-warningSoft p-2.5 text-[11.5px] leading-5 text-warning" role="alert">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{configMessage}</p>
            </div>
          ) : null}

          {user ? (
            <button type="button" onClick={checkStatus} className="btn-secondary btn-sm mt-3" disabled={busy}>
              <RefreshCw size={12} className={busy ? 'animate-spin' : ''} aria-hidden="true" />
              {busy ? 'Checking…' : 'Check subscription status'}
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/signup" onClick={onClose} className="btn-primary btn-sm">
                Create an account
              </Link>
              <Link to="/login" onClick={onClose} className="btn-secondary btn-sm">
                Sign in
              </Link>
            </div>
          )}
        </div>

        {onBrowseFree ? (
          <button type="button" onClick={onBrowseFree} className="text-[12.5px] font-medium text-accent-hover hover:underline hover:underline-offset-4">
            Show me the free templates instead
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
