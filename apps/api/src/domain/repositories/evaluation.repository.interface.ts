import { BidEvaluationDto } from '@procurement/shared-types';

export interface CreateEvaluationData {
  bidId: string;
  evaluatorId: string;
  technicalScore: number;
  financialScore: number;
  totalScore: number;
  comments?: string;
}

export const EVALUATION_REPOSITORY = Symbol('EVALUATION_REPOSITORY');

export interface IEvaluationRepository {
  create(data: CreateEvaluationData): Promise<BidEvaluationDto>;
  findByBid(bidId: string): Promise<BidEvaluationDto[]>;
  findByBidAndEvaluator(bidId: string, evaluatorId: string): Promise<BidEvaluationDto | null>;
  findByTender(tenderId: string): Promise<BidEvaluationDto[]>;
}
