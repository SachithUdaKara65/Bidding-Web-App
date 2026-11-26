import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { TENDER_REPOSITORY, ITenderRepository } from '../../../domain/repositories/tender.repository.interface';
import { BID_REPOSITORY, IBidRepository } from '../../../domain/repositories/bid.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { TenderDto, TenderStatus, BidStatus, JwtPayload } from '@procurement/shared-types';

@Injectable()
export class OpenTenderBidsUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(tenderId: string, currentUser: JwtPayload): Promise<TenderDto> {
    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    // Only buyers from the owning organization or admins can open bids
    if (currentUser.role !== 'ADMIN') {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );
      if (!isBuyerMember) {
        throw new ForbiddenException('Only the buyer organization can open bids for this tender');
      }
    }

    // The tender must be in OPEN_FOR_BIDDING or CLOSED status
    if (
      tender.status !== TenderStatus.OPEN_FOR_BIDDING &&
      tender.status !== TenderStatus.CLOSED
    ) {
      throw new BadRequestException(
        `Cannot open bids for a tender in '${tender.status}' status. Must be OPEN_FOR_BIDDING or CLOSED.`
      );
    }

    // The submission deadline must have passed
    if (new Date() < tender.submissionDeadline) {
      const timeLeft = Math.ceil(
        (tender.submissionDeadline.getTime() - Date.now()) / 60000
      );
      throw new BadRequestException(
        `Bids cannot be opened until the submission deadline has passed (${timeLeft} minutes remaining)`
      );
    }

    // Transition to UNDER_EVALUATION and unseal all bids
    const updatedTender = await this.tenderRepository.update(tenderId, {
      status: TenderStatus.UNDER_EVALUATION,
    });

    // Unseal all non-withdrawn bids
    const bids = await this.bidRepository.findByTender(tenderId);
    await Promise.all(
      bids
        .filter(({ bid }) => bid.status !== BidStatus.WITHDRAWN)
        .map(({ bid }) =>
          this.bidRepository.unsealBid(bid.id)
        )
    );

    if (!updatedTender) throw new NotFoundException('Tender not found after update');

    return {
      id: updatedTender.id,
      title: updatedTender.title,
      description: updatedTender.description,
      category: updatedTender.category,
      estimatedBudget: updatedTender.estimatedBudget,
      status: updatedTender.status,
      submissionDeadline: updatedTender.submissionDeadline.toISOString(),
      openingDate: updatedTender.openingDate.toISOString(),
      buyerOrgId: updatedTender.buyerOrgId,
      createdAt: updatedTender.createdAt.toISOString(),
      updatedAt: updatedTender.updatedAt.toISOString(),
    };
  }
}
