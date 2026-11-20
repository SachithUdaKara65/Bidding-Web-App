import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Database & Repositories
import { PrismaService } from './infrastructure/database/prisma.service';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PrismaUserRepository } from './infrastructure/database/repositories/prisma-user.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.interface';
import { PrismaRefreshTokenRepository } from './infrastructure/database/repositories/prisma-refresh-token.repository';

// Security Ports & Services
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { BcryptHasherService } from './infrastructure/security/bcrypt-hasher.service';
import { TOKEN_SERVICE } from './application/ports/token.port';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';

// Use Cases
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/auth/get-current-user.use-case';

// Guards
import { JwtAuthGuard } from './presentation/rest/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/rest/guards/roles.guard';

// Controllers
import { HealthController } from './presentation/rest/controllers/health.controller';
import { AuthController } from './presentation/rest/controllers/auth.controller';

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
  controllers: [HealthController, AuthController],
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
      provide: PASSWORD_HASHER,
      useClass: BcryptHasherService,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    GetCurrentUserUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [PrismaService, TOKEN_SERVICE, USER_REPOSITORY],
})
export class AppModule {}
