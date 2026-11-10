import mongoose from 'mongoose';

/**
 * Every Razorpay webhook delivery, recorded before it is acted on.
 *
 * `eventId` (the `x-razorpay-event-id` header, or a hash of the body when the
 * header is absent) is unique. A duplicate delivery therefore matches the
 * existing row and is acknowledged without processing anything twice.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'razorpay' },
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, trim: true, maxlength: 100, default: '' },
    signatureValid: { type: Boolean, default: false },
    status: { type: String, enum: ['received', 'processed', 'ignored', 'failed'], default: 'received', index: true },
    attempts: { type: Number, default: 1 },
    payloadHash: { type: String, maxlength: 64, default: '' },
    summary: { type: String, maxlength: 600, default: '' },
    error: { type: String, maxlength: 600, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

webhookEventSchema.index({ createdAt: -1 });
webhookEventSchema.index({ status: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
