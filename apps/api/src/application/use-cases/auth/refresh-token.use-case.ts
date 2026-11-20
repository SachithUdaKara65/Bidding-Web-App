import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../../domain/repositories/user.repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  IRefreshTokenRepository,
} from '../../../domain/repositories/refresh-token.repository.interface';
import { TOKEN_SERVICE, ITokenService } from '../../ports/token.port';
import { RefreshTokenDto, AuthTokensDto, UserStatus } from '@procurement/shared-types';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    const tokenHash = this.tokenService.hashToken(dto.refreshToken);

    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!record || record.revoked) {
      throw new UnauthorizedException('Refresh token is invalid or has been revoked');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account is invalid or inactive');
    }

    // Revoke old refresh token (token rotation)
    await this.refreshTokenRepository.revoke(record.id);

    // Issue new pair
    const tokens = await this.tokenService.generateAuthTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const newTokenHash = this.tokenService.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepository.create({
      tokenHash: newTokenHash,
      userId: user.id,
      expiresAt,
    });

    return tokens;
  }
}
