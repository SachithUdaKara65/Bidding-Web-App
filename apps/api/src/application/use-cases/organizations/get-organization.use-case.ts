import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { OrganizationDto } from '@procurement/shared-types';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(id: string): Promise<OrganizationDto> {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: org.id,
      name: org.name,
      registrationNumber: org.registrationNumber,
      type: org.type,
      address: org.address,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }
}
