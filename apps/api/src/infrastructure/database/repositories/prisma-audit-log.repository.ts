import { Injectable } from '@nestjs/common';
import {
  IAuditLogRepository,
  CreateAuditLogData,
} from '../../../domain/repositories/audit-log.repository.interface';
import { PrismaService } from '../prisma.service';
import { AuditLogDto, AuditLogQueryDto } from '@procurement/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogData): Promise<AuditLogDto> {
    const record = await this.prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      userEmail: record.user?.email || null,
      action: record.action,
      resource: record.resource,
      resourceId: record.resourceId,
      details: record.details,
      ipAddress: record.ipAddress,
      timestamp: record.timestamp.toISOString(),
    };
  }

  async findMany(query: AuditLogQueryDto): Promise<{ logs: AuditLogDto[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };

    const total = await this.prisma.auditLog.count({ where });
    const records = await this.prisma.auditLog.findMany({
      where,
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    return {
      logs: records.map((record) => ({
        id: record.id,
        userId: record.userId,
        userEmail: record.user?.email || null,
        action: record.action,
        resource: record.resource,
        resourceId: record.resourceId,
        details: record.details,
        ipAddress: record.ipAddress,
        timestamp: record.timestamp.toISOString(),
      })),
      total,
    };
  }
}
