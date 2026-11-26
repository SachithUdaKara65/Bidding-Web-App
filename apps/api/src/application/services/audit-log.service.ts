import { Injectable, Inject } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  IAuditLogRepository,
} from '../../domain/repositories/audit-log.repository.interface';
import { AuditLogDto, AuditAction } from '@procurement/shared-types';

@Injectable()
export class AuditLogService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  async log(
    action: AuditAction | string,
    resource: string,
    resourceId?: string | null,
    userId?: string | null,
    details?: string | null,
    ipAddress?: string | null
  ): Promise<AuditLogDto> {
    return this.auditLogRepository.create({
      action,
      resource,
      resourceId,
      userId,
      details,
      ipAddress,
    });
  }
}
