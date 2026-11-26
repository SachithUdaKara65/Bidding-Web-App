import { Injectable, Inject } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  IAdminRepository,
} from '../../../domain/repositories/admin.repository.interface';
import { AdminUserListQueryDto, UserDto } from '@procurement/shared-types';

@Injectable()
export class GetAdminUsersUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository
  ) {}

  async execute(query: AdminUserListQueryDto): Promise<{ users: UserDto[]; total: number }> {
    return this.adminRepository.findUsers(query);
  }
}
