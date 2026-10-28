import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
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
  const { user, subscription, refreshSubscription, subscriptionLoading, isPremium } = useAuth();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

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

  const billingConfigured = Boolean(subscription?.billing?.providerConfigured);
  const busy = checking || subscriptionLoading;

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
          <Link to="/premium" className="btn-primary" onClick={onClose}>
            See Premium
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
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
            PortiAI verifies entitlement on the server for every premium template. Plans are provisioned by the PortiAI
            team after purchase {billingConfigured ? 'or through the connected billing webhook' : '(billing checkout is not connected in this environment)'}.
            The browser never grants access.
          </p>
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
