import { JwtPayload, AuthTokensDto } from '@procurement/shared-types';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface ITokenService {
  generateAuthTokens(payload: JwtPayload): Promise<AuthTokensDto>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
  hashToken(token: string): string;
}
