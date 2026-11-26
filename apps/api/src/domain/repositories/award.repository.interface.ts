import { TenderAwardDto } from '@procurement/shared-types';

export interface CreateAwardData {
  tenderId: string;
  winningBidId: string;
  awardNotes?: string;
}

export const AWARD_REPOSITORY = Symbol('AWARD_REPOSITORY');

export interface IAwardRepository {
  create(data: CreateAwardData): Promise<TenderAwardDto>;
  findByTender(tenderId: string): Promise<TenderAwardDto | null>;
}
