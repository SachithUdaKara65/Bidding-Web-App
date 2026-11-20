import { Injectable, ConflictException, Inject } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { CreateOrganizationDto, OrganizationDto } from '@procurement/shared-types';

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(dto: CreateOrganizationDto, creatorUserId: string): Promise<OrganizationDto> {
    const existing = await this.organizationRepository.findByRegistrationNumber(
      dto.registrationNumber
    );
    if (existing) {
      throw new ConflictException(
        'An organization with this registration number already exists'
      );
    }

    const org = await this.organizationRepository.create(dto, creatorUserId);

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
