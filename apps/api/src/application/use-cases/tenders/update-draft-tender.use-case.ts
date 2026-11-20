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
import { UpdateTenderDto, TenderDto } from '@procurement/shared-types';

@Injectable()
export class UpdateDraftTenderUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    id: string,
    dto: UpdateTenderDto,
    userId: string
  ): Promise<TenderDto> {
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
        'You are not authorized to update tenders for this organization'
      );
    }

    // State machine check
    if (!existing.canEdit()) {
      throw new BadRequestException(
        `Cannot edit tender in status '${existing.status}'. Only DRAFT tenders can be edited.`
      );
    }

    const submissionDeadline = dto.submissionDeadline
      ? new Date(dto.submissionDeadline)
      : undefined;
    const openingDate = dto.openingDate
      ? new Date(dto.openingDate)
      : undefined;

    if (submissionDeadline && openingDate && openingDate < submissionDeadline) {
      throw new BadRequestException(
        'Opening date must be on or after the submission deadline'
      );
    }

    const updated = await this.tenderRepository.update(id, {
      title: dto.title,
      description: dto.description,
      category: dto.category,
      estimatedBudget: dto.estimatedBudget,
      submissionDeadline,
      openingDate,
    });

    if (!updated) {
      throw new NotFoundException('Tender not found after update');
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
