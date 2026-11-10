import { useCallback, useState } from 'react';
import { billingService } from '../services/billingService.js';
import { openRazorpayCheckout, CheckoutDismissedError } from '../utils/razorpay.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Razorpay purchase flow, shared by the pricing page and the billing page.
 *
 * Step 1 (monthly first purchase): a ₹9 order is paid.
 * Step 2: a ₹299/month mandate is authorised. The mandate starts when the ₹9
 * month ends, so nothing is double-charged. If the user closes the second
 * window, step 1 is still valid and the billing page offers "authorise
 * recurring billing" again.
 *
 * The client never decides that a payment succeeded: it only forwards the
 * provider's identifiers to `POST /subscription/razorpay/verify`, and the
 * server checks the signature and the Razorpay payment before granting access.
 */
export default function useCheckout() {
  const { refreshSubscription } = useAuth();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [error, setError] = useState('');
  const [mandateError, setMandateError] = useState('');

  const newKey = () => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch {
      /* fall through */
    }
    return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  /** Opens Checkout for an existing mandate session and verifies the result. */
  const authoriseSession = useCallback(
    async (session) => {
      if (!session?.subscriptionId) {
        throw new Error('A recurring mandate could not be created. Try again from the billing page.');
      }
      setStep('authorising');
      const checkout = await openRazorpayCheckout({
        keyId: session.keyId,
        subscriptionId: session.subscriptionId,
        amount: session.amount,
        currency: session.currency,
        description: session.description || 'PortiAI Premium recurring authorisation',
        prefill: session.prefill,
      });
      const verified = await billingService.verify({
        paymentRecordId: session.paymentRecordId,
        razorpay_payment_id: checkout.razorpay_payment_id,
        razorpay_subscription_id: checkout.razorpay_subscription_id,
        razorpay_order_id: checkout.razorpay_order_id,
        razorpay_signature: checkout.razorpay_signature,
      });
      await refreshSubscription();
      return { session, verified };
    },
    [refreshSubscription]
  );

  const authoriseMandate = useCallback(async () => {
    setMandateError('');
    const session = await billingService.mandate(newKey());
    return authoriseSession(session);
  }, [authoriseSession]);

  const purchase = useCallback(
    async (interval) => {
      setError('');
      setMandateError('');
      setStep('starting');
      setBusy(true);
      try {
        const session = await billingService.checkout(interval, newKey());

        if (session.mode === 'already_active' || session.mode === 'already_paid') {
          await refreshSubscription();
          setStep('done');
          return { mode: session.mode, session };
        }

        setStep('paying');
        const checkout = await openRazorpayCheckout({
          keyId: session.keyId,
          orderId: session.orderId,
          subscriptionId: session.subscriptionId,
          amount: session.amount,
          currency: session.currency,
          description: session.description,
          prefill: session.prefill,
        });

        setStep('verifying');
        const verified = await billingService.verify({
          paymentRecordId: session.paymentRecordId,
          razorpay_payment_id: checkout.razorpay_payment_id,
          razorpay_order_id: checkout.razorpay_order_id,
          razorpay_subscription_id: checkout.razorpay_subscription_id,
          razorpay_signature: checkout.razorpay_signature,
        });

        let mandate = verified?.mandate || null;
        let recurringError = verified?.mandateError || '';

        /* Monthly: authorise the ₹299/month mandate that starts next month. */
        if (session.mode === 'razorpay_order' && mandate) {
          try {
            /* Reuse the mandate created by verify — never create a second one. */
            const auth = await authoriseSession(mandate);
            mandate = { ...mandate, authorised: true, result: auth.verified };
          } catch (authError) {
            if (authError instanceof CheckoutDismissedError) {
              recurringError =
                'Recurring billing was not authorised. Your first month is active; authorise the monthly plan from Billing whenever you are ready.';
            } else {
              recurringError = authError.message;
            }
          }
        }

        await refreshSubscription();
        setStep('done');
        if (recurringError) setMandateError(recurringError);
        return { mode: 'success', session, verified, mandate, mandateError: recurringError };
      } catch (err) {
        if (err instanceof CheckoutDismissedError) {
          setError('Payment window closed. Nothing was charged.');
          return { mode: 'dismissed' };
        }
        setError(err.message || 'The payment could not be completed. Nothing was activated.');
        return { mode: 'error', error: err };
      } finally {
        setBusy(false);
        setStep(null);
      }
    },
    [authoriseSession, refreshSubscription]
  );

  return { purchase, authoriseMandate, busy, step, error, mandateError, setError, setMandateError };
}
