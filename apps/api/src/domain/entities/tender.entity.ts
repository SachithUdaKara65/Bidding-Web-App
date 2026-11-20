import { TenderStatus } from '@procurement/shared-types';

export class TenderEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly estimatedBudget: number | null,
    public readonly status: TenderStatus,
    public readonly submissionDeadline: Date,
    public readonly openingDate: Date,
    public readonly buyerOrgId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  canEdit(): boolean {
    return this.status === TenderStatus.DRAFT;
  }

  canPublish(): boolean {
    return this.status === TenderStatus.DRAFT;
  }

  canCancel(): boolean {
    return (
      this.status !== TenderStatus.AWARDED &&
      this.status !== TenderStatus.COMPLETED &&
      this.status !== TenderStatus.CANCELLED
    );
  }

  isSubmissionOpen(): boolean {
    const now = new Date();
    return (
      (this.status === TenderStatus.PUBLISHED || this.status === TenderStatus.OPEN_FOR_BIDDING) &&
      now <= this.submissionDeadline
    );
  }
}
