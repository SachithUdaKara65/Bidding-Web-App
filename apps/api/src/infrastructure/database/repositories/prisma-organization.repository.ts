import { Injectable } from '@nestjs/common';
import {
  IOrganizationRepository,
  CreateOrganizationData,
  UpdateOrganizationData,
} from '../../../domain/repositories/organization.repository.interface';
import { OrganizationEntity } from '../../../domain/entities/organization.entity';
import { PrismaService } from '../prisma.service';
import { OrganizationType } from '@procurement/shared-types';

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationData, creatorUserId: string): Promise<OrganizationEntity> {
    const record = await this.prisma.organization.create({
      data: {
        name: data.name,
        registrationNumber: data.registrationNumber.toUpperCase(),
        type: data.type as any,
        address: data.address || null,
        members: {
          create: {
            userId: creatorUserId,
            roleInOrg: 'OWNER',
          },
        },
      },
    });
    return this.toEntity(record);
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const record = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<OrganizationEntity | null> {
    const record = await this.prisma.organization.findUnique({
      where: { registrationNumber: registrationNumber.toUpperCase() },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async update(id: string, data: UpdateOrganizationData): Promise<OrganizationEntity | null> {
    const record = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
      },
    });
    return this.toEntity(record);
  }

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
    return !!membership;
  }

  async getUserOrganizations(userId: string): Promise<OrganizationEntity[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => this.toEntity(m.organization));
  }

  private toEntity(record: any): OrganizationEntity {
    return new OrganizationEntity(
      record.id,
      record.name,
      record.registrationNumber,
      record.type as OrganizationType,
      record.address,
      record.createdAt,
      record.updatedAt
    );
  }
}
