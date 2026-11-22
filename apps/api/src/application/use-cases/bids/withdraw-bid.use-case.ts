import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  BID_REPOSITORY,
  IBidRepository,
} from '../../../domain/repositories/bid.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { BidDto, BidStatus } from '@procurement/shared-types';

@Injectable()
export class WithdrawBidUseCase {
  constructor(
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(bidId: string, userId: string): Promise<BidDto> {
    const details = await this.bidRepository.findWithDetails(bidId);
    if (!details) {
      throw new NotFoundException('Bid not found');
    }

    const { bid, bidderOrg, tender } = details;

    const isMember = await this.organizationRepository.isMember(
      userId,
      bid.bidderOrgId
    );
    if (bid.bidderUserId !== userId && !isMember) {
      throw new ForbiddenException(
        'You are not authorized to withdraw this bid'
      );
    }

    if (bid.status === BidStatus.WITHDRAWN) {
      throw new BadRequestException('This bid has already been withdrawn');
    }

    if (tender && !bid.canWithdraw(tender.submissionDeadline)) {
      throw new BadRequestException(
        'Cannot withdraw bid after the tender submission deadline has passed'
      );
    }

    const updated = await this.bidRepository.updateStatus(
      bidId,
      BidStatus.WITHDRAWN
    );

    if (!updated) {
      throw new NotFoundException('Bid not found after status update');
    }

    return {
      id: updated.id,
      tenderId: updated.tenderId,
      bidderOrgId: updated.bidderOrgId,
      bidderOrg,
      bidderUserId: updated.bidderUserId,
      technicalProposal: updated.technicalProposal,
      financialProposalAmount: updated.financialProposalAmount,
      isSealed: updated.isSealed,
      status: updated.status,
      submittedAt: updated.submittedAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
