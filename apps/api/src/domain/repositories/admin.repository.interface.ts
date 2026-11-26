import {
  PlatformStatsDto,
  AdminUserListQueryDto,
  UserDto,
  UserStatus,
} from '@procurement/shared-types';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface IAdminRepository {
  getStats(): Promise<PlatformStatsDto>;
  findUsers(query: AdminUserListQueryDto): Promise<{ users: UserDto[]; total: number }>;
  updateUserStatus(id: string, status: UserStatus): Promise<UserDto | null>;
}
