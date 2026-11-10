import mongoose from 'mongoose';

/**
 * A single image uploaded by a signed-in user.
 *
 * This collection is the media store used by this deployment: images are small
 * (the API rejects anything over the per-purpose limit before decoding) and are
 * stored in MongoDB rather than on the server's disk, so they survive a
 * redeploy of a free-tier host. Uploads are readable by anyone with the URL:
 * they are used on public portfolios, and the id is unguessable.
 *
 * Metadata (purpose, dimensions, mime type, size) lives here and the resulting
 * URL plus a copy of the metadata is stored on the portfolio project, so a
 * project record never contains image bytes.
 */
export const UPLOAD_PURPOSES = ['portrait', 'project'];

const uploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: UPLOAD_PURPOSES, default: 'portrait', index: true },
    mimeType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
    size: { type: Number, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    originalName: { type: String, trim: true, maxlength: 200, default: '' },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

uploadSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    purpose: this.purpose || 'portrait',
    mimeType: this.mimeType,
    size: this.size,
    width: this.width || 0,
    height: this.height || 0,
    createdAt: this.createdAt,
  };
};

uploadSchema.index({ userId: 1, createdAt: -1 });
uploadSchema.index({ userId: 1, purpose: 1 });

export const Upload = mongoose.model('Upload', uploadSchema);
