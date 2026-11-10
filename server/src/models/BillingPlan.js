import mongoose from 'mongoose';

/**
 * Cache of Razorpay plan ids created by this deployment.
 *
 * Razorpay requires a plan before a subscription can be created. The plan is
 * created once per interval + amount and reused, so repeated checkouts never
 * clutter the account with duplicate plans. A plan id supplied through
 * `RAZORPAY_PLAN_ID_MONTHLY` / `_YEARLY` takes precedence and is not stored here.
 */
const billingPlanSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'razorpay' },
    interval: { type: String, enum: ['monthly', 'yearly'], required: true },
    providerPlanId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR', uppercase: true, maxlength: 3 },
  },
  { timestamps: true, versionKey: false }
);

billingPlanSchema.index({ provider: 1, interval: 1, amount: 1, currency: 1 }, { unique: true });
billingPlanSchema.index({ providerPlanId: 1 }, { unique: true });

export const BillingPlan = mongoose.model('BillingPlan', billingPlanSchema);
