import { Injectable, Inject } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  IAuditLogRepository,
} from '../../../domain/repositories/audit-log.repository.interface';
import { AuditLogDto, AuditLogQueryDto } from '@procurement/shared-types';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  async execute(query: AuditLogQueryDto): Promise<{ logs: AuditLogDto[]; total: number }> {
    return this.auditLogRepository.findMany(query);
  }
}
