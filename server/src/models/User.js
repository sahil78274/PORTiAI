import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Email address is not valid'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    /**
     * Incremented on logout. Every JWT embeds the version it was issued with,
     * so logout invalidates the existing credential server-side rather than
     * only clearing the browser cookie.
     */
    tokenVersion: { type: Number, default: 0, select: false },
    headline: { type: String, trim: true, maxlength: 120, default: '' },
    /**
     * Subscription entitlement.
     *
     * The plan is written only by the server: the signed billing webhook
     * (POST /api/subscription/webhook), the development-only upgrade
     * (POST /api/subscription/checkout, never in production) or the operator
     * script `scripts/grant-premium.mjs`. No client request can set it.
     */
    plan: { type: String, enum: ['free', 'premium'], default: 'free', index: true },
    premiumSince: { type: Date, default: null },
    premiumUntil: { type: Date, default: null },
    premiumSource: {
      type: String,
      enum: ['none', 'grant', 'billing', 'dev'],
      default: 'none',
    },
    /**
     * Administrative role. Only `admin` may open /api/admin. The role is set by
     * `scripts/grant-admin.mjs` or by listing the address in ADMIN_EMAILS; no
     * client request can change it.
     */
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    /** Razorpay customer id, reused so renewals attach to the same customer. */
    razorpayCustomerId: { type: String, trim: true, default: '', index: true },
    /**
     * AI Project Builder credits.
     *
     * The allowance is per calendar month. `used` is incremented atomically
     * before a provider call and refunded when generation fails, so a burst of
     * parallel requests cannot exceed the allowance.
     */
    aiCredits: {
      limit: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      periodStart: { type: Date, default: null },
      periodEnd: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    headline: this.headline || '',
    plan: this.plan || 'free',
    premiumSince: this.premiumSince || null,
    premiumUntil: this.premiumUntil || null,
    role: this.role || 'user',
    isAdmin: this.role === 'admin',
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
