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
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
