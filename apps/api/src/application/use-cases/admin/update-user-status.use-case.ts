import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  IAdminRepository,
} from '../../../domain/repositories/admin.repository.interface';
import { UserDto, UserStatus, AuditAction } from '@procurement/shared-types';
import { AuditLogService } from '../../services/audit-log.service';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly auditLogService: AuditLogService
  ) {}

  async execute(
    userId: string,
    status: UserStatus,
    adminUserId: string
  ): Promise<UserDto> {
    const updated = await this.adminRepository.updateUserStatus(userId, status);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    await this.auditLogService.log(
      AuditAction.USER_STATUS_CHANGE,
      'USER',
      userId,
      adminUserId,
      `User status changed to ${status}`
    );

    return updated;
  }
}
