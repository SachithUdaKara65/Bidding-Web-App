import { Injectable } from '@nestjs/common';
import { IUserRepository, CreateUserData } from '../../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/entities/user.entity';
import { PrismaService } from '../prisma.service';
import { UserRole, UserStatus } from '@procurement/shared-types';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!record) return null;
    return this.toEntity(record);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const record = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        status: (data.status || UserStatus.ACTIVE) as any,
      },
    });
    return this.toEntity(record);
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserEntity | null> {
    const record = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
    return this.toEntity(record);
  }

  private toEntity(record: any): UserEntity {
    return new UserEntity(
      record.id,
      record.email,
      record.passwordHash,
      record.firstName,
      record.lastName,
      record.role as UserRole,
      record.status as UserStatus,
      record.createdAt,
      record.updatedAt
    );
  }
}
