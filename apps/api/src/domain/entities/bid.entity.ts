import { BidStatus } from '@procurement/shared-types';

export class BidEntity {
  constructor(
    public readonly id: string,
    public readonly tenderId: string,
    public readonly bidderOrgId: string,
    public readonly bidderUserId: string,
    public readonly technicalProposal: string,
    public readonly financialProposalAmount: number,
    public readonly isSealed: boolean,
    public readonly status: BidStatus,
    public readonly submittedAt: Date,
    public readonly updatedAt: Date
  ) {}

  canWithdraw(submissionDeadline: Date): boolean {
    const now = new Date();
    return this.status === 'SUBMITTED' && now <= submissionDeadline;
  }

  isOwner(userId: string, userOrgIds: string[] = []): boolean {
    return this.bidderUserId === userId || userOrgIds.includes(this.bidderOrgId);
  }
}
