import mongoose from 'mongoose';

/**
 * A single profile image uploaded by a signed-in user.
 *
 * Images are small (the API rejects anything over 500 KB before decoding) and
 * are stored in MongoDB rather than on the server's disk, so they survive a
 * redeploy of a free-tier host. Uploads are readable by anyone with the URL:
 * they are used on public portfolios, and the id is unguessable.
 */
const uploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mimeType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

uploadSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    mimeType: this.mimeType,
    size: this.size,
    createdAt: this.createdAt,
  };
};

uploadSchema.index({ userId: 1, createdAt: -1 });

export const Upload = mongoose.model('Upload', uploadSchema);
