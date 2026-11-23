import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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
export class GetBuyerTendersUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    buyerOrgId: string,
    userId: string,
    options?: { status?: TenderStatus; limit?: number; offset?: number }
  ): Promise<{ tenders: TenderDto[]; total: number }> {
    const org = await this.organizationRepository.findById(buyerOrgId);
    if (!org) {
      throw new NotFoundException('Buyer organization not found');
    }

    const isMember = await this.organizationRepository.isMember(userId, buyerOrgId);
    if (!isMember) {
      throw new ForbiddenException(
        'You are not authorized to view tenders for this organization'
      );
    }

    const result = await this.tenderRepository.findByBuyerOrg(buyerOrgId, options);

    return {
      tenders: result.tenders.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        estimatedBudget: t.estimatedBudget,
        status: t.status,
        submissionDeadline: t.submissionDeadline.toISOString(),
        openingDate: t.openingDate.toISOString(),
        buyerOrgId: t.buyerOrgId,
        buyerOrg: {
          id: org.id,
          name: org.name,
          registrationNumber: org.registrationNumber,
        },
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
