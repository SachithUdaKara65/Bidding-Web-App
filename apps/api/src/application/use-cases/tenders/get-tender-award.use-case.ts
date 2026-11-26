import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { TENDER_REPOSITORY, ITenderRepository } from '../../../domain/repositories/tender.repository.interface';
import { AWARD_REPOSITORY, IAwardRepository } from '../../../domain/repositories/award.repository.interface';
import { ORGANIZATION_REPOSITORY, IOrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { TenderAwardDto, TenderStatus, JwtPayload } from '@procurement/shared-types';

@Injectable()
export class GetTenderAwardUseCase {
  constructor(
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(AWARD_REPOSITORY)
    private readonly awardRepository: IAwardRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(tenderId: string, currentUser: JwtPayload): Promise<TenderAwardDto> {
    const tender = await this.tenderRepository.findById(tenderId);
    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    if (
      tender.status !== TenderStatus.AWARDED &&
      tender.status !== TenderStatus.COMPLETED
    ) {
      // Only buyer members may preview unpublished award
      if (currentUser.role !== 'ADMIN') {
        const isBuyerMember = await this.organizationRepository.isMember(
          currentUser.sub,
          tender.buyerOrgId
        );
        if (!isBuyerMember) {
          throw new ForbiddenException('Award information is not yet available for this tender');
        }
      }
    }

    const award = await this.awardRepository.findByTender(tenderId);
    if (!award) {
      throw new NotFoundException('No award record found for this tender');
    }
    return award;
  }
}
