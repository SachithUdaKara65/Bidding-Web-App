import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  TENDER_REPOSITORY,
  ITenderRepository,
} from '../../../domain/repositories/tender.repository.interface';
import { TenderDto } from '@procurement/shared-types';

@Injectable()
export class GetTenderDetailsUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository
  ) {}

  async execute(id: string): Promise<TenderDto> {
    const details = await this.tenderRepository.findWithDetails(id);
    if (!details) {
      throw new NotFoundException('Tender not found');
    }

    const t = details.tender;

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      estimatedBudget: t.estimatedBudget,
      status: t.status,
      submissionDeadline: t.submissionDeadline.toISOString(),
      openingDate: t.openingDate.toISOString(),
      buyerOrgId: t.buyerOrgId,
      buyerOrg: details.buyerOrg,
      documents: details.documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
