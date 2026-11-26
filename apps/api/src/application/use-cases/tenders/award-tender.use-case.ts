import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { TENDER_REPOSITORY, ITenderRepository } from '../../../domain/repositories/tender.repository.interface';
import { BID_REPOSITORY, IBidRepository } from '../../../domain/repositories/bid.repository.interface';
import {
  AWARD_REPOSITORY,
  IAwardRepository,
} from '../../../domain/repositories/award.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { TenderAwardDto, TenderStatus, BidStatus, JwtPayload } from '@procurement/shared-types';
import { AwardTenderInput } from '@procurement/shared-validation';

@Injectable()
export class AwardTenderUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(AWARD_REPOSITORY)
    private readonly awardRepository: IAwardRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    tenderId: string,
    dto: AwardTenderInput,
    currentUser: JwtPayload
  ): Promise<TenderAwardDto> {
    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    // Only buyer org members or admins can award
    if (currentUser.role !== 'ADMIN') {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );
      if (!isBuyerMember) {
        throw new ForbiddenException('Only the buyer organization can award this tender');
      }
    }

    // Tender must be UNDER_EVALUATION
    if (tender.status !== TenderStatus.UNDER_EVALUATION) {
      throw new BadRequestException(
        `Tender can only be awarded when UNDER_EVALUATION (current: ${tender.status})`
      );
    }

    // The winning bid must exist and belong to this tender
    const winningBidDetails = await this.bidRepository.findWithDetails(dto.winningBidId);
    if (!winningBidDetails || winningBidDetails.bid.tenderId !== tenderId) {
      throw new NotFoundException('Winning bid not found on this tender');
    }

    if (winningBidDetails.bid.status === BidStatus.WITHDRAWN) {
      throw new BadRequestException('Cannot award a withdrawn bid');
    }

    // Create the award record
    const award = await this.awardRepository.create({
      tenderId,
      winningBidId: dto.winningBidId,
      awardNotes: dto.awardNotes,
    });

    // Transition tender status to AWARDED
    await this.tenderRepository.update(tenderId, { status: TenderStatus.AWARDED });

    // Mark winning bid as ACCEPTED and all other non-withdrawn bids as REJECTED
    const allBids = await this.bidRepository.findByTender(tenderId);
    await Promise.all(
      allBids.map(({ bid }) => {
        if (bid.id === dto.winningBidId) {
          return this.bidRepository.updateStatus(bid.id, BidStatus.ACCEPTED);
        }
        if (bid.status !== BidStatus.WITHDRAWN) {
          return this.bidRepository.updateStatus(bid.id, BidStatus.REJECTED);
        }
      })
    );

    return award;
  }
}
