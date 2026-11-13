import mongoose from 'mongoose';

/**
 * Administrator-controlled template availability.
 *
 * The template catalogue itself is a static, versioned JSON file
 * (`src/data/templateCatalogue.json`). This collection only stores overrides:
 * a template with no document here is enabled. Disabling a template blocks
 * new portfolios from selecting it; existing portfolios keep working.
 */
const templateSettingSchema = new mongoose.Schema(
  {
    templateId: { type: String, trim: true, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false }
);

export const TemplateSetting = mongoose.model('TemplateSetting', templateSettingSchema);
