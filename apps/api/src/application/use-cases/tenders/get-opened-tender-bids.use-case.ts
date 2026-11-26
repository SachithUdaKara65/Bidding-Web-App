import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { TENDER_REPOSITORY, ITenderRepository } from '../../../domain/repositories/tender.repository.interface';
import { BID_REPOSITORY, IBidRepository } from '../../../domain/repositories/bid.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { BidDto, TenderStatus, JwtPayload } from '@procurement/shared-types';

@Injectable()
export class GetOpenedTenderBidsUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(tenderId: string, currentUser: JwtPayload): Promise<BidDto[]> {
    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    // Only visible after bids are opened
    const openedStatuses = [
      TenderStatus.UNDER_EVALUATION,
      TenderStatus.AWARDED,
      TenderStatus.COMPLETED,
    ];
    if (!openedStatuses.includes(tender.status as any)) {
      throw new ForbiddenException(
        'Bid details are only accessible after the official bid opening'
      );
    }

    // Only buyer org members or admins can see all bids
    if (currentUser.role !== 'ADMIN') {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );
      if (!isBuyerMember) {
        throw new ForbiddenException('Only the buyer organization can view all bids after opening');
      }
    }

    const bidWithDetailsList = await this.bidRepository.findByTender(tenderId);
    return bidWithDetailsList.map(({ bid, bidderOrg }) => ({
      id: bid.id,
      tenderId: bid.tenderId,
      bidderOrgId: bid.bidderOrgId,
      bidderOrg,
      bidderUserId: bid.bidderUserId,
      technicalProposal: bid.technicalProposal,
      financialProposalAmount: bid.financialProposalAmount,
      isSealed: bid.isSealed,
      status: bid.status,
      submittedAt: bid.submittedAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
    }));
  }
}
