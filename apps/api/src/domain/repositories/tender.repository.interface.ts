import { TenderEntity } from '../entities/tender.entity';
import { TenderStatus } from '@procurement/shared-types';

export interface CreateTenderData {
  title: string;
  description: string;
  category: string;
  estimatedBudget?: number | null;
  submissionDeadline: Date;
  openingDate: Date;
  buyerOrgId: string;
  status?: TenderStatus;
}

export interface UpdateTenderData {
  title?: string;
  description?: string;
  category?: string;
  estimatedBudget?: number | null;
  submissionDeadline?: Date;
  openingDate?: Date;
  status?: TenderStatus;
}

export interface FindTendersOptions {
  status?: TenderStatus;
  limit?: number;
  offset?: number;
}

export interface PublicTenderQuery {
  search?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: TenderStatus;
  limit?: number;
  offset?: number;
}

export interface TenderWithDetails {
  tender: TenderEntity;
  buyerOrg: {
    id: string;
    name: string;
    registrationNumber: string;
  };
  documents: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
}

export const TENDER_REPOSITORY = Symbol('TENDER_REPOSITORY');

export interface ITenderRepository {
  create(data: CreateTenderData): Promise<TenderEntity>;
  findById(id: string): Promise<TenderEntity | null>;
  findWithDetails(id: string): Promise<TenderWithDetails | null>;
  findByBuyerOrg(buyerOrgId: string, options?: FindTendersOptions): Promise<{ tenders: TenderEntity[]; total: number }>;
  findPublicTenders(query: PublicTenderQuery): Promise<{ tenders: TenderWithDetails[]; total: number }>;
  update(id: string, data: UpdateTenderData): Promise<TenderEntity | null>;
  updateStatus(id: string, status: TenderStatus): Promise<TenderEntity | null>;
}
