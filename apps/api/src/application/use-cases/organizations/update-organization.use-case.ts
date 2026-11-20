import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import { UpdateOrganizationDto, OrganizationDto } from '@procurement/shared-types';

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository
  ) {}

  async execute(
    id: string,
    dto: UpdateOrganizationDto,
    userId: string
  ): Promise<OrganizationDto> {
    const isMember = await this.organizationRepository.isMember(userId, id);
    if (!isMember) {
      throw new ForbiddenException('You are not authorized to update this organization');
    }

    const updated = await this.organizationRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: updated.id,
      name: updated.name,
      registrationNumber: updated.registrationNumber,
      type: updated.type,
      address: updated.address,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
