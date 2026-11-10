import mongoose from 'mongoose';

/**
 * Audit record for every AI Project Builder provider call.
 *
 * Credits are the user-facing limit; this collection is the operational trail
 * used by the admin panel (generations, credit consumption, failures) without
 * storing prompts or generated code.
 */
const aiGenerationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiProject', default: null, index: true },
    kind: {
      type: String,
      enum: ['project', 'files', 'regenerate-file', 'modify-file', 'manual-save'],
      default: 'project',
      index: true,
    },
    provider: { type: String, trim: true, maxlength: 40, default: '' },
    model: { type: String, trim: true, maxlength: 120, default: '' },
    stack: { type: String, trim: true, maxlength: 40, default: '' },
    credits: { type: Number, default: 0 },
    status: { type: String, enum: ['success', 'failed'], default: 'success', index: true },
    errorCode: { type: String, trim: true, maxlength: 60, default: '' },
    promptChars: { type: Number, default: 0 },
    outputChars: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

aiGenerationSchema.index({ createdAt: -1 });
aiGenerationSchema.index({ userId: 1, createdAt: -1 });
aiGenerationSchema.index({ status: 1, createdAt: -1 });

export const AiGeneration = mongoose.model('AiGeneration', aiGenerationSchema);
