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
  EVALUATION_REPOSITORY,
  IEvaluationRepository,
} from '../../../domain/repositories/evaluation.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { TenderEvaluationSummaryDto, TenderStatus, BidDto, JwtPayload } from '@procurement/shared-types';

@Injectable()
export class GetTenderEvaluationSummaryUseCase {
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

  async execute(tenderId: string, currentUser: JwtPayload): Promise<TenderEvaluationSummaryDto> {
    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    // Only buyer org members or admins can view evaluation summary
    if (currentUser.role !== 'ADMIN') {
      const isBuyerMember = await this.organizationRepository.isMember(
        currentUser.sub,
        tender.buyerOrgId
      );
      if (!isBuyerMember) {
        throw new ForbiddenException('Only the buyer organization can view evaluation summaries');
      }
    }

    if (
      tender.status !== TenderStatus.UNDER_EVALUATION &&
      tender.status !== TenderStatus.AWARDED &&
      tender.status !== TenderStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Evaluation summary is only available after bids are opened (current status: ${tender.status})`
      );
    }

    const bidWithDetailsList = await this.bidRepository.findByTender(tenderId);
    const result: TenderEvaluationSummaryDto['bids'] = [];

    for (const { bid, bidderOrg } of bidWithDetailsList) {
      const evaluations = await this.evaluationRepository.findByBid(bid.id);

      const avg = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const bidDto: BidDto = {
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

      result.push({
        bid: bidDto,
        evaluations,
        averageTechnicalScore: Math.round(avg(evaluations.map((e) => e.technicalScore)) * 100) / 100,
        averageFinancialScore: Math.round(avg(evaluations.map((e) => e.financialScore)) * 100) / 100,
        averageTotalScore: Math.round(avg(evaluations.map((e) => e.totalScore)) * 100) / 100,
      });
    }

    // Sort descending by average total score
    result.sort((a, b) => b.averageTotalScore - a.averageTotalScore);

    return {
      tenderId: tender.id,
      tenderTitle: tender.title,
      status: tender.status,
      bids: result,
    };
  }
}
