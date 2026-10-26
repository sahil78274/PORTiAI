import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
      index: true,
    },
    title: { type: String, required: [true, 'A post title is required'], trim: true, maxlength: 160 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 90, required: true },
    excerpt: { type: String, trim: true, maxlength: 320, default: '' },
    content: { type: String, trim: true, maxlength: 20000, default: '' },
    coverUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Post slugs only need to be unique inside one portfolio.
blogPostSchema.index({ portfolioId: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ userId: 1, updatedAt: -1 });
blogPostSchema.index({ portfolioId: 1, published: 1, publishedAt: -1 });

blogPostSchema.methods.toOwnerJSON = function toOwnerJSON() {
  const obj = this.toObject({ version: false });
  return {
    id: this._id.toString(),
    portfolioId: obj.portfolioId?.toString(),
    title: obj.title,
    slug: obj.slug,
    excerpt: obj.excerpt,
    content: obj.content,
    coverUrl: obj.coverUrl,
    tags: obj.tags || [],
    published: obj.published,
    publishedAt: obj.publishedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

/** Public shape: content only, no owner identifiers, no draft state. */
blogPostSchema.methods.toPublicJSON = function toPublicJSON() {
  const obj = this.toOwnerJSON();
  return {
    title: obj.title,
    slug: obj.slug,
    excerpt: obj.excerpt,
    content: obj.content,
    coverUrl: obj.coverUrl,
    tags: obj.tags,
    publishedAt: obj.publishedAt || obj.createdAt,
  };
};

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
