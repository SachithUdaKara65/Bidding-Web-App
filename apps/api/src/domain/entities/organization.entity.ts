import { OrganizationType } from '@procurement/shared-types';

export class OrganizationEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly registrationNumber: string,
    public readonly type: OrganizationType,
    public readonly address: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isBuyer(): boolean {
    return this.type === 'BUYER';
  }

  isVendor(): boolean {
    return this.type === 'VENDOR';
  }
}
