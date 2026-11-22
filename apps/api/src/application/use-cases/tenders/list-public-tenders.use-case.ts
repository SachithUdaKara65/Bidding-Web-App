import { Injectable, Inject } from '@nestjs/common';
import {
  TENDER_REPOSITORY,
  ITenderRepository,
  PublicTenderQuery,
} from '../../../domain/repositories/tender.repository.interface';
import { TenderDto } from '@procurement/shared-types';

@Injectable()
export class ListPublicTendersUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository
  ) {}

  async execute(query: PublicTenderQuery): Promise<{ tenders: TenderDto[]; total: number }> {
    const result = await this.tenderRepository.findPublicTenders(query);

    return {
      tenders: result.tenders.map((item) => ({
        id: item.tender.id,
        title: item.tender.title,
        description: item.tender.description,
        category: item.tender.category,
        estimatedBudget: item.tender.estimatedBudget,
        status: item.tender.status,
        submissionDeadline: item.tender.submissionDeadline.toISOString(),
        openingDate: item.tender.openingDate.toISOString(),
        buyerOrgId: item.tender.buyerOrgId,
        buyerOrg: item.buyerOrg,
        documents: item.documents.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          fileType: d.fileType,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt.toISOString(),
        })),
        createdAt: item.tender.createdAt.toISOString(),
        updatedAt: item.tender.updatedAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
