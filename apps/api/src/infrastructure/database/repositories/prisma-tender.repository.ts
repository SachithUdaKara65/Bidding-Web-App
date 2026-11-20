import { Injectable } from '@nestjs/common';
import {
  ITenderRepository,
  CreateTenderData,
  UpdateTenderData,
  FindTendersOptions,
  TenderWithDetails,
} from '../../../domain/repositories/tender.repository.interface';
import { TenderEntity } from '../../../domain/entities/tender.entity';
import { PrismaService } from '../prisma.service';
import { TenderStatus } from '@procurement/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaTenderRepository implements ITenderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTenderData): Promise<TenderEntity> {
    const record = await this.prisma.tender.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        estimatedBudget:
          data.estimatedBudget !== undefined && data.estimatedBudget !== null
            ? new Prisma.Decimal(data.estimatedBudget)
            : null,
        status: (data.status || TenderStatus.DRAFT) as any,
        submissionDeadline: data.submissionDeadline,
        openingDate: data.openingDate,
        buyerOrgId: data.buyerOrgId,
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<TenderEntity | null> {
    const record = await this.prisma.tender.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findWithDetails(id: string): Promise<TenderWithDetails | null> {
    const record = await this.prisma.tender.findUnique({
      where: { id },
      include: {
        buyerOrg: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
        documents: true,
      },
    });
    if (!record) return null;

    return {
      tender: this.toEntity(record),
      buyerOrg: record.buyerOrg,
      documents: record.documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt,
      })),
    };
  }

  async findByBuyerOrg(
    buyerOrgId: string,
    options?: FindTendersOptions
  ): Promise<{ tenders: TenderEntity[]; total: number }> {
    const where: Prisma.TenderWhereInput = {
      buyerOrgId,
      ...(options?.status ? { status: options.status as any } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.tender.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.tender.count({ where }),
    ]);

    return {
      tenders: records.map((r) => this.toEntity(r)),
      total,
    };
  }

  async update(id: string, data: UpdateTenderData): Promise<TenderEntity | null> {
    const record = await this.prisma.tender.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.estimatedBudget !== undefined
          ? {
              estimatedBudget:
                data.estimatedBudget !== null
                  ? new Prisma.Decimal(data.estimatedBudget)
                  : null,
            }
          : {}),
        ...(data.submissionDeadline ? { submissionDeadline: data.submissionDeadline } : {}),
        ...(data.openingDate ? { openingDate: data.openingDate } : {}),
      },
    });
    return this.toEntity(record);
  }

  async updateStatus(id: string, status: TenderStatus): Promise<TenderEntity | null> {
    const record = await this.prisma.tender.update({
      where: { id },
      data: { status: status as any },
    });
    return this.toEntity(record);
  }

  private toEntity(record: any): TenderEntity {
    return new TenderEntity(
      record.id,
      record.title,
      record.description,
      record.category,
      record.estimatedBudget ? Number(record.estimatedBudget) : null,
      record.status as TenderStatus,
      record.submissionDeadline,
      record.openingDate,
      record.buyerOrgId,
      record.createdAt,
      record.updatedAt
    );
  }
}
