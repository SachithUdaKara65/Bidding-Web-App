import { Injectable } from '@nestjs/common';
import {
  IAdminRepository,
} from '../../../domain/repositories/admin.repository.interface';
import { PrismaService } from '../prisma.service';
import {
  PlatformStatsDto,
  AdminUserListQueryDto,
  UserDto,
  UserStatus,
  UserRole,
} from '@procurement/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<PlatformStatsDto> {
    const totalTenders = await this.prisma.tender.count();
    const openTenders = await this.prisma.tender.count({ where: { status: 'OPEN_FOR_BIDDING' } });
    const underEvaluationTenders = await this.prisma.tender.count({ where: { status: 'UNDER_EVALUATION' } });
    const awardedTenders = await this.prisma.tender.count({ where: { status: 'AWARDED' } });
    const totalBids = await this.prisma.bid.count();
    const totalUsers = await this.prisma.user.count();
    const totalBuyers = await this.prisma.user.count({ where: { role: 'BUYER' } });
    const totalBidders = await this.prisma.user.count({ where: { role: 'BIDDER' } });
    const awardedBids = await this.prisma.tenderAward.findMany({
      include: {
        winningBid: {
          select: { financialProposalAmount: true },
        },
      },
    });

    const totalAwardedValue = awardedBids.reduce(
      (sum, item) => sum + Number(item.winningBid.financialProposalAmount),
      0
    );

    return {
      totalTenders,
      openTenders,
      underEvaluationTenders,
      awardedTenders,
      totalBids,
      totalUsers,
      totalBuyers,
      totalBidders,
      totalAwardedValue,
    };
  }

  async findUsers(query: AdminUserListQueryDto): Promise<{ users: UserDto[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role as any } : {}),
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const total = await this.prisma.user.count({ where });
    const records = await this.prisma.user.findMany({
      where,
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    });

    return {
      users: records.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      total,
    };
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<UserDto | null> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
