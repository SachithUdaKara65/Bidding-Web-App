import { Injectable } from '@nestjs/common';
import {
  IBidRepository,
  CreateBidData,
  BidWithDetails,
} from '../../../domain/repositories/bid.repository.interface';
import { BidEntity } from '../../../domain/entities/bid.entity';
import { PrismaService } from '../prisma.service';
import { BidStatus } from '@procurement/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaBidRepository implements IBidRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBidData): Promise<BidEntity> {
    const record = await this.prisma.bid.create({
      data: {
        tenderId: data.tenderId,
        bidderOrgId: data.bidderOrgId,
        bidderUserId: data.bidderUserId,
        technicalProposal: data.technicalProposal,
        financialProposalAmount: new Prisma.Decimal(data.financialProposalAmount),
        isSealed: data.isSealed ?? true,
        status: BidStatus.SUBMITTED as any,
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<BidEntity | null> {
    const record = await this.prisma.bid.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findWithDetails(id: string): Promise<BidWithDetails | null> {
    const record = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        bidderOrg: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
        tender: {
          select: {
            id: true,
            title: true,
            submissionDeadline: true,
            openingDate: true,
            status: true,
            buyerOrgId: true,
          },
        },
      },
    });
    if (!record) return null;

    return {
      bid: this.toEntity(record),
      bidderOrg: record.bidderOrg,
      tender: record.tender,
    };
  }

  async findByTenderAndOrg(tenderId: string, bidderOrgId: string): Promise<BidEntity | null> {
    const record = await this.prisma.bid.findUnique({
      where: {
        tenderId_bidderOrgId: {
          tenderId,
          bidderOrgId,
        },
      },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findByUserOrgs(orgIds: string[]): Promise<BidWithDetails[]> {
    if (orgIds.length === 0) return [];

    const records = await this.prisma.bid.findMany({
      where: {
        bidderOrgId: { in: orgIds },
      },
      include: {
        bidderOrg: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
        tender: {
          select: {
            id: true,
            title: true,
            submissionDeadline: true,
            openingDate: true,
            status: true,
            buyerOrgId: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return records.map((r) => ({
      bid: this.toEntity(r),
      bidderOrg: r.bidderOrg,
      tender: r.tender,
    }));
  }

  async findByTender(tenderId: string): Promise<BidWithDetails[]> {
    const records = await this.prisma.bid.findMany({
      where: { tenderId },
      include: {
        bidderOrg: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return records.map((r) => ({
      bid: this.toEntity(r),
      bidderOrg: r.bidderOrg,
    }));
  }

  async updateStatus(id: string, status: BidStatus): Promise<BidEntity | null> {
    const record = await this.prisma.bid.update({
      where: { id },
      data: { status: status as any },
    });
    return this.toEntity(record);
  }

  async unsealBid(id: string): Promise<BidEntity | null> {
    const record = await this.prisma.bid.update({
      where: { id },
      data: { isSealed: false },
    });
    return this.toEntity(record);
  }

  private toEntity(record: any): BidEntity {
    return new BidEntity(
      record.id,
      record.tenderId,
      record.bidderOrgId,
      record.bidderUserId,
      record.technicalProposal,
      Number(record.financialProposalAmount),
      record.isSealed,
      record.status as BidStatus,
      record.submittedAt,
      record.updatedAt
    );
  }
}
