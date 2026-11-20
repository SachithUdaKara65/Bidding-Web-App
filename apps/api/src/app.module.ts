import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Database & Repositories
import { PrismaService } from './infrastructure/database/prisma.service';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/database/repositories/prisma-user.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.interface';
import { PrismaRefreshTokenRepository } from './infrastructure/database/repositories/prisma-refresh-token.repository';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository.interface';
import { PrismaOrganizationRepository } from './infrastructure/database/repositories/prisma-organization.repository';
import { TENDER_REPOSITORY } from './domain/repositories/tender.repository.interface';
import { PrismaTenderRepository } from './infrastructure/database/repositories/prisma-tender.repository';

// Security Ports & Services
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { BcryptHasherService } from './infrastructure/security/bcrypt-hasher.service';
import { TOKEN_SERVICE } from './application/ports/token.port';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';

// Use Cases - Auth
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/auth/get-current-user.use-case';

// Use Cases - Organizations
import { CreateOrganizationUseCase } from './application/use-cases/organizations/create-organization.use-case';
import { GetOrganizationUseCase } from './application/use-cases/organizations/get-organization.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/organizations/update-organization.use-case';

// Use Cases - Tenders
import { CreateDraftTenderUseCase } from './application/use-cases/tenders/create-draft-tender.use-case';
import { UpdateDraftTenderUseCase } from './application/use-cases/tenders/update-draft-tender.use-case';
import { PublishTenderUseCase } from './application/use-cases/tenders/publish-tender.use-case';
import { CancelTenderUseCase } from './application/use-cases/tenders/cancel-tender.use-case';
import { GetBuyerTendersUseCase } from './application/use-cases/tenders/get-buyer-tenders.use-case';
import { GetTenderDetailsUseCase } from './application/use-cases/tenders/get-tender-details.use-case';

// Guards
import { JwtAuthGuard } from './presentation/rest/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/rest/guards/roles.guard';

// Controllers
import { HealthController } from './presentation/rest/controllers/health.controller';
import { AuthController } from './presentation/rest/controllers/auth.controller';
import { OrganizationController } from './presentation/rest/controllers/organization.controller';
import { TenderController } from './presentation/rest/controllers/tender.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    OrganizationController,
    TenderController,
  ],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository,
    },
    {
      provide: TENDER_REPOSITORY,
      useClass: PrismaTenderRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptHasherService,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    // Auth Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    GetCurrentUserUseCase,
    // Organization Use Cases
    CreateOrganizationUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    // Tender Use Cases
    CreateDraftTenderUseCase,
    UpdateDraftTenderUseCase,
    PublishTenderUseCase,
    CancelTenderUseCase,
    GetBuyerTendersUseCase,
    GetTenderDetailsUseCase,
    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    PrismaService,
    TOKEN_SERVICE,
    USER_REPOSITORY,
    ORGANIZATION_REPOSITORY,
    TENDER_REPOSITORY,
  ],
})
export class AppModule {}
