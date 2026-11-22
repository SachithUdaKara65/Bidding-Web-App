import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
import { BidDto, MaskedBidDto, UserRole, JwtPayload } from '@procurement/shared-types';

@Injectable()
export class GetBidDetailsUseCase {
  constructor(
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    bidId: string,
    currentUser: JwtPayload
  ): Promise<BidDto | MaskedBidDto> {
    const details = await this.bidRepository.findWithDetails(bidId);
    if (!details) {
      throw new NotFoundException('Bid not found');
    }

    const { bid, bidderOrg, tender } = details;

    // 1. ADMIN has full access
    if (currentUser.role === UserRole.ADMIN) {
      return this.toFullDto(bid, bidderOrg);
    }

    // 2. Check if caller belongs to bidder's vendor organization or is submitting user
    const isBidderMember = await this.organizationRepository.isMember(
      currentUser.sub,
      bid.bidderOrgId
    );
    if (bid.bidderUserId === currentUser.sub || isBidderMember) {
      return this.toFullDto(bid, bidderOrg);
    }

    // 3. Check if caller belongs to the Buyer organization that owns the tender
    if (tender) {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );

      if (isBuyerMember) {
        // Enforce Sealed Bidding: Mask proposals while isSealed is true
        if (bid.isSealed) {
          return {
            id: bid.id,
            tenderId: bid.tenderId,
            bidderOrgId: bid.bidderOrgId,
            bidderOrg: {
              id: bidderOrg.id,
              name: bidderOrg.name,
            },
            isSealed: true,
            status: bid.status,
            submittedAt: bid.submittedAt.toISOString(),
          };
        }

        // Once unsealed, buyer can view full proposal
        return this.toFullDto(bid, bidderOrg);
      }
    }

    // 4. Any other user (e.g. competitor bidder) is forbidden
    throw new ForbiddenException(
      'Access denied. Competitors cannot view sealed bids.'
    );
  }

  private toFullDto(bid: any, bidderOrg: any): BidDto {
    return {
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
    };
  }
}
