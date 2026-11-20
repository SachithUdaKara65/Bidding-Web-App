import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationType } from '@procurement/shared-types';

export interface CreateOrganizationData {
  name: string;
  registrationNumber: string;
  type: OrganizationType;
  address?: string | null;
}

export interface UpdateOrganizationData {
  name?: string;
  address?: string | null;
}

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface IOrganizationRepository {
  create(data: CreateOrganizationData, creatorUserId: string): Promise<OrganizationEntity>;
  findById(id: string): Promise<OrganizationEntity | null>;
  findByRegistrationNumber(registrationNumber: string): Promise<OrganizationEntity | null>;
  update(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity | null>;
  isMember(userId: string, organizationId: string): Promise<boolean>;
  getUserOrganizations(userId: string): Promise<OrganizationEntity[]>;
}
