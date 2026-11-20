import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ITokenService } from '../../application/ports/token.port';
import { JwtPayload, AuthTokensDto } from '@procurement/shared-types';

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresInSeconds = 15 * 60; // 15 minutes
  private readonly refreshExpiresInSeconds = 7 * 24 * 60 * 60; // 7 days

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'dev-access-secret-key-change-in-production-12345';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'dev-refresh-secret-key-change-in-production-67890';
  }

  async generateAuthTokens(payload: JwtPayload): Promise<AuthTokensDto> {
    const accessPayload = { sub: payload.sub, email: payload.email, role: payload.role };
    const refreshPayload = { sub: payload.sub, email: payload.email, role: payload.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresInSeconds,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresInSeconds,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresInSeconds,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
