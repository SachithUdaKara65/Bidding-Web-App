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
import { BID_REPOSITORY } from './domain/repositories/bid.repository.interface';
import { PrismaBidRepository } from './infrastructure/database/repositories/prisma-bid.repository';
import { EVALUATION_REPOSITORY } from './domain/repositories/evaluation.repository.interface';
import { PrismaEvaluationRepository } from './infrastructure/database/repositories/prisma-evaluation.repository';
import { AWARD_REPOSITORY } from './domain/repositories/award.repository.interface';
import { PrismaAwardRepository } from './infrastructure/database/repositories/prisma-award.repository';
import { DOCUMENT_REPOSITORY } from './domain/repositories/document.repository.interface';
import { PrismaDocumentRepository } from './infrastructure/database/repositories/prisma-document.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { PrismaAuditLogRepository } from './infrastructure/database/repositories/prisma-audit-log.repository';
import { ADMIN_REPOSITORY } from './domain/repositories/admin.repository.interface';
import { PrismaAdminRepository } from './infrastructure/database/repositories/prisma-admin.repository';

// Security Ports & Services
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { BcryptHasherService } from './infrastructure/security/bcrypt-hasher.service';
import { TOKEN_SERVICE } from './application/ports/token.port';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { STORAGE_SERVICE } from './application/ports/storage.port';
import { SupabaseStorageService } from './infrastructure/storage/supabase-storage.service';
import { AuditLogService } from './application/services/audit-log.service';

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
import { ListPublicTendersUseCase } from './application/use-cases/tenders/list-public-tenders.use-case';
import { GetPublicTenderDetailsUseCase } from './application/use-cases/tenders/get-public-tender-details.use-case';

// Use Cases - Bids
import { SubmitBidUseCase } from './application/use-cases/bids/submit-bid.use-case';
import { GetMyBidsUseCase } from './application/use-cases/bids/get-my-bids.use-case';
import { GetBidDetailsUseCase } from './application/use-cases/bids/get-bid-details.use-case';
import { WithdrawBidUseCase } from './application/use-cases/bids/withdraw-bid.use-case';
import { SubmitEvaluationUseCase } from './application/use-cases/bids/submit-evaluation.use-case';
import { GetTenderEvaluationSummaryUseCase } from './application/use-cases/bids/get-tender-evaluation-summary.use-case';

// Use Cases - Phase 4 Tender Opening & Awarding
import { OpenTenderBidsUseCase } from './application/use-cases/tenders/open-tender-bids.use-case';
import { GetOpenedTenderBidsUseCase } from './application/use-cases/tenders/get-opened-tender-bids.use-case';
import { AwardTenderUseCase } from './application/use-cases/tenders/award-tender.use-case';
import { GetTenderAwardUseCase } from './application/use-cases/tenders/get-tender-award.use-case';

// Use Cases - Phase 5 Documents & Admin
import { GenerateUploadUrlUseCase } from './application/use-cases/documents/generate-upload-url.use-case';
import { GenerateDownloadUrlUseCase } from './application/use-cases/documents/generate-download-url.use-case';
import { GetPlatformStatsUseCase } from './application/use-cases/admin/get-platform-stats.use-case';
import { GetAdminUsersUseCase } from './application/use-cases/admin/get-admin-users.use-case';
import { UpdateUserStatusUseCase } from './application/use-cases/admin/update-user-status.use-case';
import { GetAuditLogsUseCase } from './application/use-cases/admin/get-audit-logs.use-case';

// Guards
import { JwtAuthGuard } from './presentation/rest/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/rest/guards/roles.guard';

// Controllers
import { HealthController } from './presentation/rest/controllers/health.controller';
import { AuthController } from './presentation/rest/controllers/auth.controller';
import { OrganizationController } from './presentation/rest/controllers/organization.controller';
import { TenderController } from './presentation/rest/controllers/tender.controller';
import { BidController } from './presentation/rest/controllers/bid.controller';
import { EvaluationController } from './presentation/rest/controllers/evaluation.controller';
import { AwardController } from './presentation/rest/controllers/award.controller';
import { DocumentController } from './presentation/rest/controllers/document.controller';
import { AdminController } from './presentation/rest/controllers/admin.controller';

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
    BidController,
    EvaluationController,
    AwardController,
    DocumentController,
    AdminController,
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
      provide: BID_REPOSITORY,
      useClass: PrismaBidRepository,
    },
    {
      provide: EVALUATION_REPOSITORY,
      useClass: PrismaEvaluationRepository,
    },
    {
      provide: AWARD_REPOSITORY,
      useClass: PrismaAwardRepository,
    },
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    {
      provide: ADMIN_REPOSITORY,
      useClass: PrismaAdminRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptHasherService,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: STORAGE_SERVICE,
      useClass: SupabaseStorageService,
    },
    AuditLogService,
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
    ListPublicTendersUseCase,
    GetPublicTenderDetailsUseCase,
    // Bid Use Cases
    SubmitBidUseCase,
    GetMyBidsUseCase,
    GetBidDetailsUseCase,
    WithdrawBidUseCase,
    // Phase 4 Evaluation & Award Use Cases
    SubmitEvaluationUseCase,
    GetTenderEvaluationSummaryUseCase,
    OpenTenderBidsUseCase,
    GetOpenedTenderBidsUseCase,
    AwardTenderUseCase,
    GetTenderAwardUseCase,
    // Phase 5 Documents & Admin Use Cases
    GenerateUploadUrlUseCase,
    GenerateDownloadUrlUseCase,
    GetPlatformStatsUseCase,
    GetAdminUsersUseCase,
    UpdateUserStatusUseCase,
    GetAuditLogsUseCase,
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
    BID_REPOSITORY,
    EVALUATION_REPOSITORY,
    AWARD_REPOSITORY,
    DOCUMENT_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    ADMIN_REPOSITORY,
    STORAGE_SERVICE,
    AuditLogService,
  ],
})
export class AppModule {}
