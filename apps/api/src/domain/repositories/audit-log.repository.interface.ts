import { AuditLogDto, AuditLogQueryDto } from '@procurement/shared-types';

export interface CreateAuditLogData {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogDto>;
  findMany(query: AuditLogQueryDto): Promise<{ logs: AuditLogDto[]; total: number }>;
}
