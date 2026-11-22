import { z } from 'zod';
import { UserRole, OrganizationType, TenderStatus } from '@procurement/shared-types';

// Auth Validation Schemas
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

// Organization Validation Schemas
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Organization name must be at least 2 characters long' })
    .max(200),
  registrationNumber: z
    .string()
    .trim()
    .min(2, { message: 'Registration number is required' })
    .max(100),
  type: z.enum([OrganizationType.BUYER, OrganizationType.VENDOR], {
    errorMap: () => ({ message: 'Organization type must be BUYER or VENDOR' }),
  }),
  address: z.string().trim().max(500).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  address: z.string().trim().max(500).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

// Tender Validation Schemas
export const createTenderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: 'Tender title must be at least 5 characters long' })
    .max(255),
  description: z
    .string()
    .trim()
    .min(20, { message: 'Tender description must be at least 20 characters long' }),
  category: z
    .string()
    .trim()
    .min(2, { message: 'Category is required' })
    .max(100),
  estimatedBudget: z
    .number()
    .positive({ message: 'Estimated budget must be a positive number' })
    .optional(),
  submissionDeadline: z
    .string()
    .datetime({ message: 'Submission deadline must be a valid ISO 8601 date string' }),
  openingDate: z
    .string()
    .datetime({ message: 'Opening date must be a valid ISO 8601 date string' }),
  buyerOrgId: z
    .string()
    .uuid({ message: 'Valid buyer organization ID is required' }),
}).refine(
  (data) => new Date(data.openingDate) >= new Date(data.submissionDeadline),
  {
    message: 'Bid opening date must be on or after the submission deadline',
    path: ['openingDate'],
  }
).refine(
  (data) => new Date(data.submissionDeadline) > new Date(),
  {
    message: 'Submission deadline must be set in the future',
    path: ['submissionDeadline'],
  }
);

export type CreateTenderInput = z.infer<typeof createTenderSchema>;

export const updateTenderSchema = z.object({
  title: z.string().trim().min(5).max(255).optional(),
  description: z.string().trim().min(20).optional(),
  category: z.string().trim().min(2).max(100).optional(),
  estimatedBudget: z.number().positive().optional(),
  submissionDeadline: z.string().datetime().optional(),
  openingDate: z.string().datetime().optional(),
});

export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;

export const publicTenderQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minBudget: z.coerce.number().positive().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  status: z
    .enum([
      TenderStatus.OPEN_FOR_BIDDING,
      TenderStatus.PUBLISHED,
      TenderStatus.CLOSED,
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type PublicTenderQueryInput = z.infer<typeof publicTenderQuerySchema>;

// Bid Validation Schemas
export const submitBidSchema = z.object({
  bidderOrgId: z
    .string()
    .uuid({ message: 'Valid bidder organization ID is required' }),
  technicalProposal: z
    .string()
    .trim()
    .min(20, { message: 'Technical proposal must be at least 20 characters long' }),
  financialProposalAmount: z
    .number()
    .positive({ message: 'Financial proposal amount must be greater than 0' }),
});

export type SubmitBidInput = z.infer<typeof submitBidSchema>;
