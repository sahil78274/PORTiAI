import { z } from 'zod';
import { sanitizeText, sanitizeUrl, sanitizeStringArray } from '../utils/sanitize.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogPostSchema = z.object({
  portfolioId: z.string().regex(/^[a-f0-9]{24}$/i, 'Choose a portfolio for this post.'),
  title: z.string().trim().min(3, 'Give the post a title of at least 3 characters.').max(160),
  slug: z.string().trim().max(90).optional(),
  excerpt: z.string().trim().max(320).optional().default(''),
  content: z.string().max(20000).optional().default(''),
  coverUrl: z.string().trim().max(2048).optional().default(''),
  tags: z.array(z.string().max(30)).max(8).optional().default([]),
});

export const blogUpdateSchema = blogPostSchema.partial().omit({ portfolioId: true });

export const publishSchema = z.object({
  published: z.boolean(),
});

/** Turns a title into a URL-safe slug. */
export const blogSlugify = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';

/** Sanitises every writable field before it reaches MongoDB. */
export const normalizeBlogBody = (body = {}) => {
  const out = {};
  if (typeof body.title === 'string') out.title = sanitizeText(body.title, 160);
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const slug = blogSlugify(body.slug);
    if (slugPattern.test(slug)) out.slug = slug;
  }
  if (typeof body.excerpt === 'string') out.excerpt = sanitizeText(body.excerpt, 320);
  // Markdown content is stored as plain text: HTML tags are stripped so a post
  // can never inject markup into the public page.
  if (typeof body.content === 'string') out.content = sanitizeText(body.content, 20000);
  if (typeof body.coverUrl === 'string') out.coverUrl = sanitizeUrl(body.coverUrl);
  if (Array.isArray(body.tags)) out.tags = sanitizeStringArray(body.tags, { maxItems: 8, maxLength: 30 });
  return out;
};
