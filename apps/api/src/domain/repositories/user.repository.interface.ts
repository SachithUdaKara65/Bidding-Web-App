import { UserEntity } from '../entities/user.entity';
import { UserRole, UserStatus } from '@procurement/shared-types';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  updateStatus(id: string, status: UserStatus): Promise<UserEntity | null>;
}
