import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  TENDER_REPOSITORY,
  ITenderRepository,
} from '../../../domain/repositories/tender.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { TenderDto, TenderStatus } from '@procurement/shared-types';

@Injectable()
export class CancelTenderUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(id: string, userId: string): Promise<TenderDto> {
    const existing = await this.tenderRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Tender not found');
    }

    const isMember = await this.organizationRepository.isMember(
      userId,
      existing.buyerOrgId
    );
    if (!isMember) {
      throw new ForbiddenException(
        'You are not authorized to cancel tenders for this organization'
      );
    }

    // State machine check
    if (!existing.canCancel()) {
      throw new BadRequestException(
        `Cannot cancel tender in status '${existing.status}'.`
      );
    }

    const updated = await this.tenderRepository.updateStatus(
      id,
      TenderStatus.CANCELLED
    );

    if (!updated) {
      throw new NotFoundException('Tender not found after status update');
    }

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      estimatedBudget: updated.estimatedBudget,
      status: updated.status,
      submissionDeadline: updated.submissionDeadline.toISOString(),
      openingDate: updated.openingDate.toISOString(),
      buyerOrgId: updated.buyerOrgId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
