import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.use-case';
import { GetCurrentUserUseCase } from '../../../application/use-cases/auth/get-current-user.use-case';
import {
  REFRESH_TOKEN_REPOSITORY,
  IRefreshTokenRepository,
} from '../../../domain/repositories/refresh-token.repository.interface';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '@procurement/shared-validation';
import { AuthResponseDto, AuthTokensDto, UserDto, JwtPayload } from '@procurement/shared-types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterInput): Promise<AuthResponseDto> {
    return this.registerUserUseCase.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput): Promise<AuthResponseDto> {
    return this.loginUserUseCase.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() body: RefreshTokenInput): Promise<AuthTokensDto> {
    return this.refreshTokenUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    await this.refreshTokenRepository.revokeAllForUser(user.sub);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserDto> {
    return this.getCurrentUserUseCase.execute(user.sub);
  }
}
