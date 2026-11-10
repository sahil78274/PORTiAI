import mongoose from 'mongoose';

/**
 * One payment attempt or captured payment.
 *
 * Amounts are stored in minor units (paise) exactly as Razorpay reports them,
 * so a verification can compare integers and never trust a client amount.
 *
 * Idempotency:
 *   - `providerPaymentId` is unique, so a repeated verification or webhook for
 *     the same payment cannot create a second record.
 *   - `idempotencyKey` is unique, so retrying "create checkout" with the same
 *     client-provided key returns the original record.
 */
export const PAYMENT_STATUSES = ['created', 'pending', 'captured', 'failed', 'refunded'];
export const PAYMENT_KINDS = ['intro', 'monthly', 'yearly', 'renewal', 'manual'];

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    provider: { type: String, enum: ['razorpay', 'manual'], default: 'razorpay' },
    kind: { type: String, enum: PAYMENT_KINDS, required: true, index: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'created', index: true },
    /** Amount in minor units (paise), as charged. */
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, maxlength: 3 },
    providerOrderId: { type: String, trim: true, default: '', index: true },
    /** Omitted until Razorpay reports a payment id — the unique sparse index relies on absence. */
    providerPaymentId: { type: String, trim: true },
    providerSubscriptionId: { type: String, trim: true, default: '', index: true },
    receiptNumber: { type: String, trim: true, maxlength: 60, default: '' },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    /** True only after the HMAC signature and the provider amount were checked. */
    signatureVerified: { type: Boolean, default: false },
    failureReason: { type: String, trim: true, maxlength: 500, default: '' },
    paidAt: { type: Date, default: null },
    idempotencyKey: { type: String, trim: true, maxlength: 120 },
    eventId: { type: String, trim: true, maxlength: 160, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index({ providerPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ kind: 1, status: 1 });

const rupees = (minor) => Math.round(Number(minor || 0)) / 100;

paymentSchema.methods.toReceiptJSON = function toReceiptJSON() {
  return {
    id: this._id.toString(),
    receiptNumber: this.receiptNumber || `PTI-${this._id.toString().slice(-8).toUpperCase()}`,
    kind: this.kind,
    status: this.status,
    amount: this.amount,
    amountMajor: rupees(this.amount),
    currency: this.currency,
    description: this.description,
    paidAt: this.paidAt,
    createdAt: this.createdAt,
    signatureVerified: Boolean(this.signatureVerified),
    failureReason: this.failureReason || '',
    provider: this.provider,
    providerOrderId: this.providerOrderId || '',
    providerPaymentId: this.providerPaymentId || '',
    // Never expose the key secret, webhook secret or gateway credentials.
  };
};

paymentSchema.methods.toAdminJSON = function toAdminJSON(userEmail = '') {
  return {
    ...this.toReceiptJSON(),
    userId: this.userId.toString(),
    userEmail,
    providerSubscriptionId: this.providerSubscriptionId || '',
    subscriptionId: this.subscriptionId ? this.subscriptionId.toString() : null,
    idempotencyKey: this.idempotencyKey || '',
  };
};

export const Payment = mongoose.model('Payment', paymentSchema);
