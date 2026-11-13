import mongoose from 'mongoose';

/**
 * Audit record for every sensitive administrator action.
 *
 * Written only by the admin API (see `services/adminAuditService.js`). The
 * `details` field is free-form but must never contain secrets: no password
 * hashes, no session tokens, no Razorpay key/webhook secrets, no card data.
 */
const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    action: { type: String, trim: true, maxlength: 80, required: true, index: true },
    targetType: { type: String, trim: true, maxlength: 40, default: '' },
    targetId: { type: String, trim: true, maxlength: 80, default: '' },
    targetEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true, maxlength: 80, default: '' },
  },
  { timestamps: true, versionKey: false }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
