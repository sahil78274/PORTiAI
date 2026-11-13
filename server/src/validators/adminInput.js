import { z } from 'zod';

/**
 * Validation for the admin API.
 *
 * Query schemas coerce page/limit to numbers and whitelist every filter
 * value, so an unknown filter can never become an arbitrary Mongo query.
 * Bodies are strict: unknown keys are stripped by zod's default behaviour
 * and every field is length-bounded.
 */

const pageQuery = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
};

const searchQuery = {
  search: z.string().trim().max(120).default(''),
};

const dateRange = {
  from: z.string().trim().max(40).optional(),
  to: z.string().trim().max(40).optional(),
};

export const userListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  plan: z.enum(['all', 'free', 'premium']).default('all'),
  status: z.enum(['all', 'active', 'suspended']).default('all'),
  sort: z.enum(['newest', 'oldest', 'name', 'email']).default('newest'),
});

export const subscriptionListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  status: z.enum(['all', 'pending', 'active', 'failed', 'cancelled', 'expired']).default('all'),
  interval: z.enum(['all', 'monthly', 'yearly']).default('all'),
});

export const paymentListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  status: z.enum(['all', 'created', 'pending', 'captured', 'failed', 'refunded']).default('all'),
  kind: z.enum(['all', 'intro', 'monthly', 'yearly', 'renewal', 'manual']).default('all'),
  ...dateRange,
});

export const generationListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  status: z.enum(['all', 'success', 'failed']).default('all'),
  kind: z.enum(['all', 'project', 'files', 'regenerate-file', 'modify-file', 'manual-save']).default('all'),
  stack: z.enum(['all', 'html-css-js', 'react', 'react-express', 'mern', 'python']).default('all'),
  ...dateRange,
});

export const projectListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  status: z.enum(['all', 'generating', 'ready', 'failed']).default('all'),
  complexity: z.enum(['all', 'starter', 'standard', 'advanced']).default('all'),
  stack: z.enum(['all', 'html-css-js', 'react', 'react-express', 'mern', 'python']).default('all'),
  ...dateRange,
});

export const portfolioListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  published: z.enum(['all', 'published', 'draft']).default('all'),
  templateId: z.string().trim().max(80).default(''),
});

export const blogListQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  published: z.enum(['all', 'published', 'draft']).default('all'),
});

export const auditLogQuerySchema = z.object({
  ...pageQuery,
  ...searchQuery,
  action: z.string().trim().max(80).default(''),
});

export const grantPremiumSchema = z.object({
  months: z.coerce.number().int().min(1).max(36).default(1),
  reason: z.string().trim().max(500).default(''),
});

export const revokePremiumSchema = z.object({
  reason: z.string().trim().max(500).default(''),
});

export const suspendSchema = z.object({
  reason: z.string().trim().max(500).default(''),
});

export const publishSchema = z.object({
  published: z.boolean(),
});

export const templateToggleSchema = z.object({
  enabled: z.boolean(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long.')
    .max(72)
    .regex(/[a-zA-Z]/, 'New password must include at least one letter.')
    .regex(/[0-9]/, 'New password must include at least one number.'),
});
