import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database via Prisma.');
    } catch (error) {
      this.logger.warn(
        'Prisma could not connect to database at startup. Please verify DATABASE_URL in .env: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
