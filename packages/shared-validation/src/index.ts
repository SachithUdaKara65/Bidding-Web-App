import { z } from 'zod';
import { UserRole } from '@procurement/shared-types';

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' })
    .max(255),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  firstName: z
    .string()
    .trim()
    .min(1, { message: 'First name is required' })
    .max(100),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Last name is required' })
    .max(100),
  role: z.enum([UserRole.BUYER, UserRole.BIDDER], {
    errorMap: () => ({ message: 'Role must be either BUYER or BIDDER' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, { message: 'Refresh token is required' }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
