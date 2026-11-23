import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../../domain/repositories/user.repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  IRefreshTokenRepository,
} from '../../../domain/repositories/refresh-token.repository.interface';
import { PASSWORD_HASHER, IPasswordHasher } from '../../ports/password-hasher.port';
import { TOKEN_SERVICE, ITokenService } from '../../ports/token.port';
import { RegisterDto, AuthResponseDto, UserDto } from '@procurement/shared-types';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });

    const tokens = await this.tokenService.generateAuthTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const tokenHash = this.tokenService.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.refreshTokenRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return {
      user: userDto,
      tokens,
    };
  }
}
