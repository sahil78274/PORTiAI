import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../components/ui/Primitives.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { billingService } from '../services/billingService.js';
import useCheckout from '../hooks/useCheckout.js';

const STATUS_STYLES = {
  active: 'border-successLine bg-successSoft text-success',
  pending: 'border-warningLine bg-warningSoft text-warning',
  failed: 'border-dangerLine bg-dangerSoft text-danger',
  cancelled: 'border-warningLine bg-warningSoft text-warning',
  expired: 'border-lineStrong bg-canvasAlt text-muted',
  free: 'border-lineStrong bg-canvasAlt text-muted',
};

const STATUS_COPY = {
  active: 'Active',
  pending: 'Pending authorisation',
  failed: 'Payment failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  free: 'Free',
};

const money = (minor, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      (Number(minor) || 0) / 100
    );
  } catch {
    return `₹${Math.round((Number(minor) || 0) / 100)}`;
  }
};

const date = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Billing() {
  const { user, subscription, isPremium, refreshSubscription } = useAuth();
  const toast = useToast();
  const { authoriseMandate, busy: mandateBusy } = useCheckout();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await billingService.history();
      setData(next);
    } catch (err) {
      setError(err.message || 'Billing information could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const record = data?.subscription || null;
  const entitlements = data?.entitlements || subscription || {};
  const credits = data?.credits;
  const payments = data?.payments || [];
  const cancellation = data?.cancellation || {};

  const status = useMemo(() => {
    if (!entitlements?.isPremium && !record) return 'free';
    if (!entitlements?.isPremium && record?.status === 'expired') return 'expired';
    if (record?.status) return record.status;
    return entitlements?.isPremium ? 'active' : 'free';
  }, [entitlements?.isPremium, record]);

  const canAuthorise =
    Boolean(data?.billing?.razorpayConfigured) &&
    entitlements?.isPremium &&
    record?.interval === 'monthly' &&
    record?.introOfferUsed &&
    !record?.recurringAuthorised &&
    !record?.cancelAtPeriodEnd;

  const onAuthorise = async () => {
    try {
      const result = await authoriseMandate();
      toast.success('Recurring billing authorised.', {
        description:
          result?.session?.startAt
            ? `The first ₹299 charge is scheduled for ${date(result.session.startAt)}.`
            : 'Your monthly plan will renew automatically until cancelled.',
      });
      await refreshSubscription();
      await load();
    } catch (err) {
      toast.error(err.message || 'Recurring billing could not be authorised.');
    }
  };

  const onCancel = async () => {
    setCancelling(true);
    try {
      const result = await billingService.cancel({ reason: 'Cancelled by the customer' });
      toast.success('Subscription cancelled.', {
        description: result.accessUntil
          ? `Premium stays active until ${date(result.accessUntil)}. It will not renew.`
          : 'Premium access has ended.',
      });
      setCancelOpen(false);
      await refreshSubscription();
      await load();
    } catch (err) {
      toast.error(err.message || 'The subscription could not be cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading billing…" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Billing" description="Your Premium subscription, receipts and renewal settings." />
        <Alert tone="error" title="Billing could not be loaded" className="mt-5">
          {error}
          <div className="mt-2">
            <Button variant="secondary" size="sm" onClick={load}>
              <RefreshCcw size={13} aria-hidden="true" />
              Try again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Billing & subscription"
        description="Every payment here was verified on the PortiAI server. Razorpay handles your card, UPI and bank details."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={load} loading={loading}>
              <RefreshCcw size={13} aria-hidden="true" />
              Refresh
            </Button>
            <Link to="/pricing" className="btn-primary btn-sm">
              <Sparkles size={13} aria-hidden="true" />
              {isPremium ? 'Change plan' : 'Upgrade'}
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Plan"
          value={entitlements?.isPremium ? 'Premium' : 'Free'}
          hint={
            entitlements?.isPremium
              ? record?.interval === 'yearly'
                ? 'Yearly subscription'
                : 'Monthly subscription'
              : 'Upgrade to unlock everything'
          }
          tone={entitlements?.isPremium ? 'emerald' : 'indigo'}
        />
        <StatCard
          icon={CalendarClock}
          label={entitlements?.cancelAtPeriodEnd ? 'Access ends' : 'Renews / ends'}
          value={date(entitlements?.premiumUntil)}
          hint={
            entitlements?.cancelAtPeriodEnd
              ? 'Cancelled — will not renew'
              : entitlements?.renewal?.willRenew
                ? 'Renews automatically'
                : 'No automatic renewal'
          }
          tone={entitlements?.cancelAtPeriodEnd ? 'amber' : 'violet'}
        />
        <StatCard
          icon={CreditCard}
          label="Recurring amount"
          value={
            entitlements?.isPremium
              ? record?.interval === 'yearly'
                ? `${money(record?.amount || 305000)} / yr`
                : `${money(record?.amount || 29900)} / mo`
              : '—'
          }
          hint={record?.recurringAuthorised ? 'Managed by Razorpay' : 'No recurring mandate'}
        />
        <StatCard
          icon={Sparkles}
          label="AI project credits"
          value={credits ? `${credits.remaining}/${credits.limit}` : '—'}
          hint={credits?.periodEnd ? `Resets ${date(credits.periodEnd)}` : 'Premium only'}
        />
      </div>

      {/* ---------------------------------------------------- Plan status */}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {entitlements?.isPremium ? 'PortiAI Premium' : 'Free plan'}
              </h2>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
                  STATUS_STYLES[status] || STATUS_STYLES.free
                }`}
              >
                {STATUS_COPY[status] || status}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-muted">
              {entitlements?.isPremium
                ? `Premium since ${date(entitlements.premiumSince)} · ${
                    record?.interval === 'yearly' ? 'billed yearly' : 'billed monthly'
                  }`
                : 'Upgrade any time — your existing portfolios and templates stay exactly as they are.'}
            </p>
          </div>
          <Link to="/pricing" className="btn-secondary btn-sm">
            Compare plans
          </Link>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Payment method</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13px] font-medium text-ink">
              <CreditCard size={14} className="text-accent-hover" aria-hidden="true" />
              Razorpay secure checkout
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-muted">
              PortiAI never receives or stores your card number. Payment identifiers are verified with Razorpay on the
              server before Premium is activated.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-canvas p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">Cancellation policy</p>
            <p className="mt-1.5 text-[13px] font-medium text-ink">
              {entitlements?.cancelAtPeriodEnd
                ? `Access ends ${date(entitlements.premiumUntil)}`
                : entitlements?.isPremium
                  ? `Cancel any time · access until ${date(entitlements.premiumUntil)}`
                  : 'No active subscription'}
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-muted">
              {entitlements?.cancelAtPeriodEnd
                ? 'Future renewals are stopped. Premium stays available until the date above.'
                : 'Cancelling stops future renewals; the period you already paid for is not shortened and is not refunded.'}
            </p>
          </div>
        </div>

        {record?.note ? (
          <div className="border-t border-line px-5 py-3 text-[12px] leading-5 text-muted">{record.note}</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvasAlt px-5 py-3">
          {canAuthorise ? (
            <Button size="sm" onClick={onAuthorise} loading={mandateBusy}>
              <RefreshCcw size={13} aria-hidden="true" />
              Authorise ₹299 monthly renewal
            </Button>
          ) : null}
          {entitlements?.isPremium && !entitlements?.cancelAtPeriodEnd ? (
            <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle size={13} aria-hidden="true" />
              Cancel subscription
            </Button>
          ) : null}
          {!entitlements?.isPremium ? (
            <Link to="/pricing" className="btn-primary btn-sm">
              <Sparkles size={13} aria-hidden="true" />
              Upgrade to Premium
            </Link>
          ) : null}
          <Link to="/dashboard/ai-builder" className="btn-ghost btn-sm">
            Open AI Project Builder
          </Link>
        </div>
      </section>

      {!data?.billing?.razorpayConfigured ? (
        <Alert tone="warning" title="Online payment is not configured on this deployment">
          The API needs <code className="font-mono text-[11px]">RAZORPAY_KEY_ID</code>,{' '}
          <code className="font-mono text-[11px]">RAZORPAY_KEY_SECRET</code> and{' '}
          <code className="font-mono text-[11px]">RAZORPAY_WEBHOOK_SECRET</code> before subscriptions can be bought or
          auto-renewed. Existing entitlements are still read from the database.
        </Alert>
      ) : null}

      {cancellation?.message ? (
        <p className="text-[11.5px] leading-5 text-faint">{cancellation.message}</p>
      ) : null}

      {/* --------------------------------------------------------- Receipts */}
      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Payment history</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Captured and failed attempts, newest first. Open a row for its receipt.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-faint sm:inline-flex">
            <ReceiptText size={12} aria-hidden="true" />
            {payments.length} record{payments.length === 1 ? '' : 's'}
          </span>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No payments yet"
            description="Your receipts appear here as soon as a Razorpay payment is verified."
            className="m-5"
            action={
              <Link to="/pricing" className="btn-primary btn-sm">
                View plans
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-[12.5px]">
              <thead className="bg-canvasAlt text-[10.5px] uppercase tracking-[0.1em] text-faint">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Description</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Amount</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-canvasAlt">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{date(payment.paidAt || payment.createdAt)}</td>
                    <td className="px-4 py-3 text-inkSoft">
                      {payment.description || (payment.kind === 'intro' ? 'First month' : 'Premium payment')}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{payment.kind}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-ink">
                      {money(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                          payment.status === 'captured'
                            ? 'border-successLine bg-successSoft text-success'
                            : payment.status === 'failed'
                              ? 'border-dangerLine bg-dangerSoft text-danger'
                              : 'border-lineStrong bg-canvasAlt text-muted'
                        }`}
                      >
                        {payment.status === 'captured' ? (
                          <CheckCircle2 size={10} aria-hidden="true" />
                        ) : payment.status === 'failed' ? (
                          <AlertTriangle size={10} aria-hidden="true" />
                        ) : null}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setReceipt(payment)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent-hover hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {record?.lastFailureReason ? (
        <Alert tone="error" title="Last payment problem">
          {record.lastFailureReason}
          {record.retryCount ? ` Razorpay has retried ${record.retryCount} time(s).` : ''} Premium remains active until
          the paid period ends.
        </Alert>
      ) : null}

      {/* ---------------------------------------------------------- Modals */}
      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Payment receipt"
        description={receipt?.receiptNumber}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReceipt(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const lines = [
                  `PortiAI receipt ${receipt?.receiptNumber}`,
                  `Date: ${date(receipt?.paidAt || receipt?.createdAt)}`,
                  `Description: ${receipt?.description || receipt?.kind}`,
                  `Amount: ${money(receipt?.amount, receipt?.currency)}`,
                  `Status: ${receipt?.status}`,
                  `Razorpay payment id: ${receipt?.providerPaymentId || '—'}`,
                ];
                const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${receipt?.receiptNumber || 'portiai-receipt'}.txt`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 3000);
              }}
            >
              <Download size={13} aria-hidden="true" />
              Download
            </Button>
          </>
        }
      >
        {receipt ? (
          <dl className="divide-y divide-line text-[13px]">
            {[
              ['Receipt number', receipt.receiptNumber],
              ['Status', receipt.status],
              ['Description', receipt.description || receipt.kind],
              ['Amount', money(receipt.amount, receipt.currency)],
              ['Date', date(receipt.paidAt || receipt.createdAt)],
              ['Payment method', 'Razorpay'],
              ['Razorpay payment id', receipt.providerPaymentId || 'Not captured'],
              ['Razorpay order id', receipt.providerOrderId || '—'],
              ['Signature verified', receipt.signatureVerified ? 'Yes — verified on the server' : 'No'],
              ['Billed to', user?.email || ''],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
                <dt className="text-muted">{label}</dt>
                <dd className="max-w-[60%] break-all text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
            {receipt.failureReason ? (
              <div className="py-2.5">
                <dt className="text-muted">Failure reason</dt>
                <dd className="mt-1 text-danger">{receipt.failureReason}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={onCancel}
        title="Cancel your Premium subscription?"
        description={`Future renewals will stop. You keep Premium access until ${date(
          entitlements?.premiumUntil
        )} — the end of the period you have already paid for. This is not a refund.`}
        confirmLabel="Cancel subscription"
        cancelLabel="Keep Premium"
        busy={cancelling}
      >
        <p className="text-[12px] text-muted">
          You can resubscribe at any time. Your published portfolios and saved AI projects are never deleted.
        </p>
      </ConfirmDialog>

      {mandateBusy ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-ink shadow-float">
            <Loader2 size={15} className="animate-spin text-accent" aria-hidden="true" />
            Opening the secure authorisation window…
          </div>
        </div>
      ) : null}
    </div>
  );
}
