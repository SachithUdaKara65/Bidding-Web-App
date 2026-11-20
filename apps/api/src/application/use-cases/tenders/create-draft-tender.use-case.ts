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
import { CreateTenderDto, TenderDto, TenderStatus } from '@procurement/shared-types';

@Injectable()
export class CreateDraftTenderUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: CreateTenderDto, userId: string): Promise<TenderDto> {
    const org = await this.organizationRepository.findById(dto.buyerOrgId);
    if (!org) {
      throw new NotFoundException('Buyer organization not found');
    }

    if (!org.isBuyer()) {
      throw new BadRequestException('Only BUYER organizations can create tenders');
    }

    const isMember = await this.organizationRepository.isMember(userId, dto.buyerOrgId);
    if (!isMember) {
      throw new ForbiddenException(
        'You are not an authorized member of this buyer organization'
      );
    }

    const submissionDeadline = new Date(dto.submissionDeadline);
    const openingDate = new Date(dto.openingDate);

    const tender = await this.tenderRepository.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      estimatedBudget: dto.estimatedBudget,
      submissionDeadline,
      openingDate,
      buyerOrgId: dto.buyerOrgId,
      status: TenderStatus.DRAFT,
    });

    return {
      id: tender.id,
      title: tender.title,
      description: tender.description,
      category: tender.category,
      estimatedBudget: tender.estimatedBudget,
      status: tender.status,
      submissionDeadline: tender.submissionDeadline.toISOString(),
      openingDate: tender.openingDate.toISOString(),
      buyerOrgId: tender.buyerOrgId,
      buyerOrg: {
        id: org.id,
        name: org.name,
        registrationNumber: org.registrationNumber,
      },
      createdAt: tender.createdAt.toISOString(),
      updatedAt: tender.updatedAt.toISOString(),
    };
  }
}
