import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must be 72 characters or fewer.')
    .regex(/[a-zA-Z]/, 'Password must include at least one letter.')
    .regex(/[0-9]/, 'Password must include at least one number.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.').max(72),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  headline: z.string().trim().max(120).optional(),
  currentPassword: z.string().max(72).optional(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long.')
    .max(72)
    .regex(/[a-zA-Z]/, 'New password must include at least one letter.')
    .regex(/[0-9]/, 'New password must include at least one number.')
    .optional(),
});
