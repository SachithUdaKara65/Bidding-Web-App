import { Injectable, Inject } from '@nestjs/common';
import {
  BID_REPOSITORY,
  IBidRepository,
} from '../../../domain/repositories/bid.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { BidDto } from '@procurement/shared-types';

@Injectable()
export class GetMyBidsUseCase {
  constructor(
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(userId: string): Promise<BidDto[]> {
    const userOrgs = await this.organizationRepository.getUserOrganizations(userId);
    const orgIds = userOrgs.map((o) => o.id);

    const bidsWithDetails = await this.bidRepository.findByUserOrgs(orgIds);

    return bidsWithDetails.map((item) => ({
      id: item.bid.id,
      tenderId: item.bid.tenderId,
      bidderOrgId: item.bid.bidderOrgId,
      bidderOrg: item.bidderOrg,
      bidderUserId: item.bid.bidderUserId,
      technicalProposal: item.bid.technicalProposal,
      financialProposalAmount: item.bid.financialProposalAmount,
      isSealed: item.bid.isSealed,
      status: item.bid.status,
      submittedAt: item.bid.submittedAt.toISOString(),
      updatedAt: item.bid.updatedAt.toISOString(),
    }));
  }
}
