import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import {
  BID_REPOSITORY,
  IBidRepository,
} from '../../../domain/repositories/bid.repository.interface';
import {
  TENDER_REPOSITORY,
  ITenderRepository,
} from '../../../domain/repositories/tender.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { SubmitBidDto, BidDto, TenderStatus } from '@procurement/shared-types';

@Injectable()
export class SubmitBidUseCase {
  constructor(
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    tenderId: string,
    dto: SubmitBidDto,
    userId: string
  ): Promise<BidDto> {
    const org = await this.organizationRepository.findById(dto.bidderOrgId);
    if (!org) {
      throw new NotFoundException('Bidder vendor organization not found');
    }

    if (!org.isVendor()) {
      throw new BadRequestException('Only VENDOR organizations can submit bids');
    }

    const isMember = await this.organizationRepository.isMember(userId, dto.bidderOrgId);
    if (!isMember) {
      throw new ForbiddenException(
        'You are not an authorized member of this vendor organization'
      );
    }

    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    // Tender must be open for bidding
    const isOpen =
      tender.status === TenderStatus.OPEN_FOR_BIDDING ||
      tender.status === TenderStatus.PUBLISHED;
    if (!isOpen) {
      throw new BadRequestException(
        `Cannot submit bids for tender in status '${tender.status}'. Tender is not open for bidding.`
      );
    }

    // Enforce submission deadline strictly on the backend
    const now = new Date();
    if (now > tender.submissionDeadline) {
      throw new BadRequestException(
        'Tender submission deadline has passed. Bids can no longer be submitted.'
      );
    }

    // Prevent duplicate bid submission from the same vendor organization
    const existingBid = await this.bidRepository.findByTenderAndOrg(
      tenderId,
      dto.bidderOrgId
    );
    if (existingBid) {
      throw new ConflictException(
        'Your organization has already submitted a bid for this tender.'
      );
    }

    // Enforce Sealed Bidding: isSealed is always true upon creation
    const bid = await this.bidRepository.create({
      tenderId,
      bidderOrgId: dto.bidderOrgId,
      bidderUserId: userId,
      technicalProposal: dto.technicalProposal,
      financialProposalAmount: dto.financialProposalAmount,
      isSealed: true,
    });

    return {
      id: bid.id,
      tenderId: bid.tenderId,
      bidderOrgId: bid.bidderOrgId,
      bidderOrg: {
        id: org.id,
        name: org.name,
        registrationNumber: org.registrationNumber,
      },
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
