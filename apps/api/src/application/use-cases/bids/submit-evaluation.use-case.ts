import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { TENDER_REPOSITORY, ITenderRepository } from '../../../domain/repositories/tender.repository.interface';
import { BID_REPOSITORY, IBidRepository } from '../../../domain/repositories/bid.repository.interface';
import {
  EVALUATION_REPOSITORY,
  IEvaluationRepository,
} from '../../../domain/repositories/evaluation.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { BidEvaluationDto, TenderStatus, JwtPayload } from '@procurement/shared-types';
import { SubmitEvaluationInput } from '@procurement/shared-validation';

@Injectable()
export class SubmitEvaluationUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(EVALUATION_REPOSITORY)
    private readonly evaluationRepository: IEvaluationRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    bidId: string,
    dto: SubmitEvaluationInput,
    currentUser: JwtPayload
  ): Promise<BidEvaluationDto> {
    // Load bid with tender details
    const details = await this.bidRepository.findWithDetails(bidId);
    if (!details) {
      throw new NotFoundException('Bid not found');
    }
    const { bid, tender } = details;

    if (!tender) {
      throw new NotFoundException('Associated tender not found');
    }

    // Tender must be UNDER_EVALUATION
    if (tender.status !== TenderStatus.UNDER_EVALUATION) {
      throw new BadRequestException(
        `Bids can only be evaluated when the tender is UNDER_EVALUATION (current: ${tender.status})`
      );
    }

    // Only buyer organization members or ADMINs can evaluate
    if (currentUser.role !== 'ADMIN') {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );
      if (!isBuyerMember) {
        throw new ForbiddenException('Only buyer organization members can evaluate bids');
      }
    }

    // Bids must be unsealed before evaluation
    if (bid.isSealed) {
      throw new BadRequestException('Cannot evaluate a sealed bid. Open bids first.');
    }

    // Prevent duplicate evaluation from same evaluator
    const existing = await this.evaluationRepository.findByBidAndEvaluator(bidId, currentUser.sub);
    if (existing) {
      throw new ConflictException('You have already submitted an evaluation for this bid');
    }

    // Compute weighted composite score (60% technical, 40% financial)
    const totalScore = dto.technicalScore * 0.6 + dto.financialScore * 0.4;

    return this.evaluationRepository.create({
      bidId,
      evaluatorId: currentUser.sub,
      technicalScore: dto.technicalScore,
      financialScore: dto.financialScore,
      totalScore: Math.round(totalScore * 100) / 100,
      comments: dto.comments,
    });
  }
}
