/**
 * Razorpay Checkout.js loader.
 *
 * The script is loaded from Razorpay's CDN only when the user starts a payment,
 * so the rest of the app works (and stays fast) without it. The API key is the
 * public `key_id` returned by the server; the key secret never reaches the
 * browser.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader = null;

export class CheckoutDismissedError extends Error {
  constructor() {
    super('Payment window closed before it was completed.');
    this.name = 'CheckoutDismissedError';
    this.code = 'CHECKOUT_DISMISSED';
  }
}

export const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payments require a browser.'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const onLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error('Razorpay Checkout loaded but was not available.'));
    };
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay Checkout.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = onLoad;
    script.onerror = () => {
      loader = null;
      reject(
        new Error(
          'Could not load Razorpay Checkout. Check your internet connection or any content blocker, then try again.'
        )
      );
    };
    document.body.appendChild(script);
  });

  return loader;
};

/**
 * Opens Checkout and resolves with the handler payload
 * (`razorpay_payment_id`, `razorpay_order_id` / `razorpay_subscription_id`,
 * `razorpay_signature`). Rejects with `CheckoutDismissedError` if the user
 * closes the window, and with a readable error when the script cannot load.
 */
export const openRazorpayCheckout = async ({
  keyId,
  orderId,
  subscriptionId,
  amount,
  currency = 'INR',
  name = 'PortiAI',
  description,
  prefill = {},
  notes,
  theme,
}) => {
  const Razorpay = await loadRazorpay();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount,
      currency,
      name,
      description,
      image: `${window.location.origin}/favicon.svg`,
      prefill: { name: prefill.name || '', email: prefill.email || '' },
      notes: notes || {},
      theme: theme || { color: '#f59e0b' },
      retry: { enabled: false },
      remember_customer: true,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new CheckoutDismissedError()),
        escape: true,
        confirm_close: true,
      },
    };
    if (orderId) options.order_id = orderId;
    if (subscriptionId) options.subscription_id = subscriptionId;

    let checkout;
    try {
      checkout = new Razorpay(options);
    } catch {
      reject(new Error('Razorpay Checkout could not be initialised. Try a different browser.'));
      return;
    }
    checkout.on('payment.failed', (response) => {
      const message =
        response?.error?.description ||
        'The payment failed. Nothing was activated — try again or use a different payment method.';
      const error = new Error(message);
      error.code = 'PAYMENT_FAILED';
      reject(error);
    });
    checkout.open();
  });
};
