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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Auth')
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
  @ApiOperation({ summary: 'Register a new buyer or bidder account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'role'],
      properties: {
        email: { type: 'string', example: 'buyer@example.com' },
        password: { type: 'string', example: 'SecurePassword123!' },
        firstName: { type: 'string', example: 'Gaveesha' },
        lastName: { type: 'string', example: 'Dev' },
        role: { type: 'string', enum: ['BUYER', 'BIDDER'], example: 'BUYER' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterInput): Promise<AuthResponseDto> {
    return this.registerUserUseCase.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and receive access & refresh tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'buyer@example.com' },
        password: { type: 'string', example: 'SecurePassword123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput): Promise<AuthResponseDto> {
    return this.loginUserUseCase.execute(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain fresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Token pair renewed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() body: RefreshTokenInput): Promise<AuthTokensDto> {
    return this.refreshTokenUseCase.execute(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log out user by revoking all active refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    await this.refreshTokenRepository.revokeAllForUser(user.sub);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserDto> {
    return this.getCurrentUserUseCase.execute(user.sub);
  }
}
