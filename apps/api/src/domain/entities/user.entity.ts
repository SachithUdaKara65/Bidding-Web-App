import { UserRole, UserStatus } from '@procurement/shared-types';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
