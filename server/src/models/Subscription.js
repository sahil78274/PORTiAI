import mongoose from 'mongoose';

/**
 * Billing subscription for one account.
 *
 * One document per user (unique `userId`). It is created when a Razorpay order
 * or subscription is initiated and updated only from verified server events:
 * signature-checked checkout verification, verified webhooks, or the expiry
 * sweeper. Status values are the ones the API and admin panel expose.
 *
 * The user's entitlement (User.plan / premiumUntil) always mirrors an active or
 * cancelled-but-not-yet-expired subscription; this document keeps the billing
 * history, provider ids and cancellation state.
 */
export const SUBSCRIPTION_STATUSES = ['pending', 'active', 'failed', 'cancelled', 'expired'];
export const BILLING_INTERVALS = ['monthly', 'yearly'];

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    provider: { type: String, enum: ['razorpay', 'none'], default: 'razorpay' },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'pending', index: true },
    interval: { type: String, enum: ['monthly', 'yearly', null], default: null },
    /** Razorpay subscription id (recurring mandate). */
    /** Omitted until Razorpay creates the mandate — the unique sparse index relies on absence. */
    providerSubscriptionId: { type: String, trim: true },
    providerPlanId: { type: String, trim: true, default: '' },
    providerCustomerId: { type: String, trim: true, default: '' },
    /** Recurring amount in minor units (paise). */
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR', uppercase: true, maxlength: 3 },
    /** Introductory ₹9 offer can be used once per account. */
    introOfferUsed: { type: Boolean, default: false },
    introPaidAt: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    /** True when the user cancelled and access runs to currentPeriodEnd. */
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    cancelEffectiveAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
    lastFailureReason: { type: String, trim: true, maxlength: 500, default: '' },
    lastPaymentAt: { type: Date, default: null },
    /** Human-readable note shown in the billing page, if any. */
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true, versionKey: false }
);

subscriptionSchema.index({ providerSubscriptionId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

/** Shape returned to the owning user. Provider secrets are never stored here. */
subscriptionSchema.methods.toOwnerJSON = function toOwnerJSON() {
  return {
    id: this._id.toString(),
    provider: this.provider,
    status: this.status,
    interval: this.interval,
    amount: this.amount,
    currency: this.currency,
    introOfferUsed: Boolean(this.introOfferUsed),
    introPaidAt: this.introPaidAt || null,
    currentPeriodStart: this.currentPeriodStart || null,
    currentPeriodEnd: this.currentPeriodEnd || null,
    cancelAtPeriodEnd: Boolean(this.cancelAtPeriodEnd),
    /** True once Razorpay has a live recurring mandate for this account. */
    recurringAuthorised: Boolean(this.providerSubscriptionId),
    cancelledAt: this.cancelledAt || null,
    cancelEffectiveAt: this.cancelEffectiveAt || null,
    startedAt: this.startedAt || null,
    endedAt: this.endedAt || null,
    retryCount: this.retryCount || 0,
    lastFailureReason: this.lastFailureReason || '',
    lastPaymentAt: this.lastPaymentAt || null,
    note: this.note || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/** Shape shown to administrators: adds masked provider identifiers only. */
subscriptionSchema.methods.toAdminJSON = function toAdminJSON(userEmail = '') {
  return {
    ...this.toOwnerJSON(),
    userId: this.userId.toString(),
    userEmail,
    // Razorpay subscription ids are not secret, but the key secret is never
    // included anywhere in this document.
    providerSubscriptionId: this.providerSubscriptionId || '',
    providerPlanId: this.providerPlanId || '',
    providerCustomerId: this.providerCustomerId || '',
  };
};

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
