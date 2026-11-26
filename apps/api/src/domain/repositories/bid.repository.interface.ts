import { BidEntity } from '../entities/bid.entity';
import { BidStatus } from '@procurement/shared-types';

export interface CreateBidData {
  tenderId: string;
  bidderOrgId: string;
  bidderUserId: string;
  technicalProposal: string;
  financialProposalAmount: number;
  isSealed?: boolean;
}

export interface BidWithDetails {
  bid: BidEntity;
  bidderOrg: {
    id: string;
    name: string;
    registrationNumber: string;
  };
  tender?: {
    id: string;
    title: string;
    submissionDeadline: Date;
    openingDate: Date;
    status: string;
    buyerOrgId: string;
  };
}

export const BID_REPOSITORY = Symbol('BID_REPOSITORY');

export interface IBidRepository {
  create(data: CreateBidData): Promise<BidEntity>;
  findById(id: string): Promise<BidEntity | null>;
  findWithDetails(id: string): Promise<BidWithDetails | null>;
  findByTenderAndOrg(tenderId: string, bidderOrgId: string): Promise<BidEntity | null>;
  findByUserOrgs(orgIds: string[]): Promise<BidWithDetails[]>;
  findByTender(tenderId: string): Promise<BidWithDetails[]>;
  updateStatus(id: string, status: BidStatus): Promise<BidEntity | null>;
  unsealBid(id: string): Promise<BidEntity | null>;
}
