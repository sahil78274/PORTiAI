import mongoose from 'mongoose';
import {
  SECTION_IDS,
  TEMPLATE_IDS,
  FONT_IDS,
  defaultVisibleSections,
  defaultPortfolioContent,
} from '../utils/portfolioDefaults.js';

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 60, default: '' },
    url: { type: String, trim: true, maxlength: 2048, default: '' },
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: ['technical', 'soft'], default: 'technical' },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true, maxlength: 160, default: '' },
    degree: { type: String, trim: true, maxlength: 160, default: '' },
    field: { type: String, trim: true, maxlength: 160, default: '' },
    startDate: { type: String, trim: true, maxlength: 40, default: '' },
    endDate: { type: String, trim: true, maxlength: 40, default: '' },
    grade: { type: String, trim: true, maxlength: 60, default: '' },
    achievements: { type: String, trim: true, maxlength: 1200, default: '' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 160, default: '' },
    description: { type: String, trim: true, maxlength: 2500, default: '' },
    technologies: { type: [String], default: [] },
    projectUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    githubUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    contributions: { type: String, trim: true, maxlength: 1500, default: '' },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true, maxlength: 160, default: '' },
    organization: { type: String, trim: true, maxlength: 160, default: '' },
    startDate: { type: String, trim: true, maxlength: 40, default: '' },
    endDate: { type: String, trim: true, maxlength: 40, default: '' },
    responsibilities: { type: String, trim: true, maxlength: 2000, default: '' },
    achievements: { type: String, trim: true, maxlength: 1500, default: '' },
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 200, default: '' },
    issuer: { type: String, trim: true, maxlength: 160, default: '' },
    date: { type: String, trim: true, maxlength: 40, default: '' },
    description: { type: String, trim: true, maxlength: 1200, default: '' },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    grade: { type: String, maxlength: 40 },
    categories: { type: mongoose.Schema.Types.Mixed },
    issues: { type: mongoose.Schema.Types.Mixed },
    recommendations: { type: mongoose.Schema.Types.Mixed },
    examples: { type: mongoose.Schema.Types.Mixed },
    source: { type: String, enum: ['rule', 'ai', 'hybrid'] },
    model: { type: String, maxlength: 120 },
    aiNotice: { type: String, maxlength: 600 },
    generatedAt: { type: Date },
    /** Hash of the content that was analysed, used to detect stale results. */
    contentHash: { type: String, maxlength: 64 },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120, default: 'Untitled portfolio' },
    slug: { type: String, trim: true, lowercase: true, minlength: 3, maxlength: 72 },
    templateId: { type: String, enum: TEMPLATE_IDS, default: 'minimal' },
    profile: {
      fullName: { type: String, trim: true, maxlength: 120, default: '' },
      title: { type: String, trim: true, maxlength: 160, default: '' },
      bio: { type: String, trim: true, maxlength: 3000, default: '' },
      summary: { type: String, trim: true, maxlength: 1200, default: '' },
      location: { type: String, trim: true, maxlength: 120, default: '' },
      contactEmail: { type: String, trim: true, maxlength: 254, default: '' },
      photoUrl: { type: String, trim: true, maxlength: 2048, default: '' },
      links: { type: [linkSchema], default: [] },
    },
    skills: { type: [skillSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    socialLinks: {
      github: { type: String, trim: true, maxlength: 2048, default: '' },
      linkedin: { type: String, trim: true, maxlength: 2048, default: '' },
      twitter: { type: String, trim: true, maxlength: 2048, default: '' },
      website: { type: String, trim: true, maxlength: 2048, default: '' },
    },
    theme: {
      accent: {
        type: String,
        trim: true,
        default: '#2f4a8b',
        match: [/^#[0-9a-fA-F]{6}$/, 'Accent must be a 6-digit hex colour'],
      },
      font: { type: String, enum: FONT_IDS, default: 'sans' },
      density: { type: String, enum: ['comfortable', 'compact'], default: 'comfortable' },
    },
    visibleSections: {
      type: [
        new mongoose.Schema(
          {
            id: { type: String, enum: SECTION_IDS, required: true },
            label: { type: String, maxlength: 60, default: '' },
            visible: { type: Boolean, default: true },
            order: { type: Number, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: defaultVisibleSections,
    },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    /** Optional public blog attached to this portfolio. */
    blog: {
      enabled: { type: Boolean, default: false },
      title: { type: String, trim: true, maxlength: 120, default: '' },
      intro: { type: String, trim: true, maxlength: 600, default: '' },
    },
    analysis: { type: analysisSchema, default: undefined },
  },
  { timestamps: true, versionKey: false }
);

portfolioSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });
portfolioSchema.index({ userId: 1, updatedAt: -1 });
portfolioSchema.index({ userId: 1, published: 1 });
portfolioSchema.index({ published: 1, slug: 1 });

portfolioSchema.pre('validate', function ensureDefaults() {
  if (!this.title || !this.title.trim()) {
    this.title = this.profile?.fullName ? `${this.profile.fullName}'s portfolio` : 'Untitled portfolio';
  }
  if (!this.templateId || !TEMPLATE_IDS.includes(this.templateId)) {
    this.templateId = 'minimal';
  }
});

/** Shape returned to the owning user (includes private metadata + status). */
portfolioSchema.methods.toOwnerJSON = function toOwnerJSON() {
  const obj = this.toObject({ version: false });
  return {
    id: this._id.toString(),
    title: obj.title,
    slug: obj.slug || null,
    templateId: TEMPLATE_IDS.includes(obj.templateId) ? obj.templateId : 'minimal',
    profile: obj.profile,
    skills: obj.skills,
    education: obj.education,
    projects: obj.projects,
    experience: obj.experience,
    achievements: obj.achievements,
    socialLinks: obj.socialLinks,
    theme: obj.theme,
    visibleSections: obj.visibleSections,
    published: obj.published,
    publishedAt: obj.publishedAt,
    blog: {
      enabled: Boolean(obj.blog?.enabled),
      title: obj.blog?.title || '',
      intro: obj.blog?.intro || '',
    },
    analysis: obj.analysis || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

/** Shape served by the public route: content only, never account data. */
portfolioSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toOwnerJSON();
  delete obj.analysis;
  return {
    ...obj,
    publicUrlPath: `/p/${obj.slug}`,
  };
};

export const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export { defaultPortfolioContent };
