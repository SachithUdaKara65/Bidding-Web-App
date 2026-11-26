import { Injectable } from '@nestjs/common';
import {
  IEvaluationRepository,
  CreateEvaluationData,
} from '../../../domain/repositories/evaluation.repository.interface';
import { PrismaService } from '../prisma.service';
import { BidEvaluationDto } from '@procurement/shared-types';

@Injectable()
export class PrismaEvaluationRepository implements IEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEvaluationData): Promise<BidEvaluationDto> {
    const record = await this.prisma.bidEvaluation.create({
      data: {
        bidId: data.bidId,
        evaluatorId: data.evaluatorId,
        technicalScore: data.technicalScore,
        financialScore: data.financialScore,
        totalScore: data.totalScore,
        comments: data.comments,
      },
    });
    return this.toDto(record);
  }

  async findByBid(bidId: string): Promise<BidEvaluationDto[]> {
    const records = await this.prisma.bidEvaluation.findMany({
      where: { bidId },
      orderBy: { evaluatedAt: 'asc' },
    });
    return records.map(this.toDto);
  }

  async findByBidAndEvaluator(bidId: string, evaluatorId: string): Promise<BidEvaluationDto | null> {
    const record = await this.prisma.bidEvaluation.findUnique({
      where: { bidId_evaluatorId: { bidId, evaluatorId } },
    });
    if (!record) return null;
    return this.toDto(record);
  }

  async findByTender(tenderId: string): Promise<BidEvaluationDto[]> {
    const records = await this.prisma.bidEvaluation.findMany({
      where: {
        bid: { tenderId },
      },
      orderBy: { evaluatedAt: 'asc' },
    });
    return records.map(this.toDto);
  }

  private toDto(record: any): BidEvaluationDto {
    return {
      id: record.id,
      bidId: record.bidId,
      evaluatorId: record.evaluatorId,
      technicalScore: record.technicalScore,
      financialScore: record.financialScore,
      totalScore: record.totalScore,
      comments: record.comments ?? null,
      evaluatedAt: record.evaluatedAt.toISOString(),
    };
  }
}
