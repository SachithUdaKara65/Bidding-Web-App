import { Injectable } from '@nestjs/common';
import {
  IAwardRepository,
  CreateAwardData,
} from '../../../domain/repositories/award.repository.interface';
import { PrismaService } from '../prisma.service';
import { TenderAwardDto } from '@procurement/shared-types';

@Injectable()
export class PrismaAwardRepository implements IAwardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAwardData): Promise<TenderAwardDto> {
    const record = await this.prisma.tenderAward.create({
      data: {
        tenderId: data.tenderId,
        winningBidId: data.winningBidId,
        awardNotes: data.awardNotes,
      },
      include: {
        winningBid: {
          include: {
            bidderOrg: {
              select: { id: true, name: true, registrationNumber: true },
            },
          },
        },
      },
    });
    return this.toDto(record);
  }

  async findByTender(tenderId: string): Promise<TenderAwardDto | null> {
    const record = await this.prisma.tenderAward.findUnique({
      where: { tenderId },
      include: {
        winningBid: {
          include: {
            bidderOrg: {
              select: { id: true, name: true, registrationNumber: true },
            },
          },
        },
      },
    });
    if (!record) return null;
    return this.toDto(record);
  }

  private toDto(record: any): TenderAwardDto {
    return {
      id: record.id,
      tenderId: record.tenderId,
      winningBidId: record.winningBidId,
      winningBid: record.winningBid
        ? {
            id: record.winningBid.id,
            tenderId: record.winningBid.tenderId,
            bidderOrgId: record.winningBid.bidderOrgId,
            bidderOrg: record.winningBid.bidderOrg,
            bidderUserId: record.winningBid.bidderUserId,
            technicalProposal: record.winningBid.technicalProposal,
            financialProposalAmount: Number(record.winningBid.financialProposalAmount),
            isSealed: record.winningBid.isSealed,
            status: record.winningBid.status,
            submittedAt: record.winningBid.submittedAt.toISOString(),
            updatedAt: record.winningBid.updatedAt.toISOString(),
          }
        : undefined,
      awardNotes: record.awardNotes ?? null,
      awardedAt: record.awardedAt.toISOString(),
    };
  }
}
