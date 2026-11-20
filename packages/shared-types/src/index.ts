// Modern TypeScript Enums (as const objects)
export const UserRole = {
  BUYER: 'BUYER',
  BIDDER: 'BIDDER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const OrganizationType = {
  BUYER: 'BUYER',
  VENDOR: 'VENDOR',
} as const;
export type OrganizationType = (typeof OrganizationType)[keyof typeof OrganizationType];

export const TenderStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  OPEN_FOR_BIDDING: 'OPEN_FOR_BIDDING',
  CLOSED: 'CLOSED',
  UNDER_EVALUATION: 'UNDER_EVALUATION',
  AWARDED: 'AWARDED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type TenderStatus = (typeof TenderStatus)[keyof typeof TenderStatus];

export const BidStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

// User & Auth Interfaces
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponseDto {
  user: UserDto;
  tokens: AuthTokensDto;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: typeof UserRole.BUYER | typeof UserRole.BIDDER;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
