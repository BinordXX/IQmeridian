import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { jwtVerify, SignJWT } from 'jose';
import { createHash, randomBytes } from 'crypto';

export type AccessTokenPayload = {
  sub: string;
  sid: string;
  email: string;
  role: `${UserRole}`;
  organisationId: string | null;
};

type TokenUser = Pick<User, 'id' | 'email' | 'role' | 'organisationId'>;

@Injectable()
export class TokenService {
  async signAccessToken(input: {
    user: TokenUser;
    authSessionId: string;
  }): Promise<string> {
    const secret = this.getAccessSecret();

    return new SignJWT({
      sid: input.authSessionId,
      email: input.user.email,
      role: input.user.role,
      organisationId: input.user.organisationId,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(this.getIssuer())
      .setAudience(this.getAudience())
      .setSubject(input.user.id)
      .setIssuedAt()
      .setExpirationTime(`${this.getAccessTokenTtlSeconds()}s`)
      .sign(secret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.getAccessSecret(), {
        issuer: this.getIssuer(),
        audience: this.getAudience(),
      });

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string'
      ) {
        throw new Error('Invalid access token payload.');
      }

      return {
        sub: payload.sub,
        sid: payload.sid,
        email: payload.email,
        role: payload.role as `${UserRole}`,
        organisationId:
          typeof payload.organisationId === 'string'
            ? payload.organisationId
            : null,
      };
    } catch {
      throw new Error('Invalid or expired access token.');
    }
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    const pepper =
      process.env.REFRESH_TOKEN_PEPPER ?? process.env.PASSWORD_PEPPER ?? '';

    return createHash('sha256')
      .update(`${pepper}:${refreshToken}`)
      .digest('hex');
  }

  getAccessTokenExpiresAt(): Date {
    return new Date(Date.now() + this.getAccessTokenTtlSeconds() * 1000);
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(
      Date.now() + this.getRefreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );
  }

  private getAccessSecret(): Uint8Array {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'JWT_ACCESS_SECRET must be set to a strong secret.',
      );
    }

    return new TextEncoder().encode(secret);
  }

  private getIssuer(): string {
    return process.env.JWT_ISSUER ?? 'iqmeridian-api';
  }

  private getAudience(): string {
    return process.env.JWT_AUDIENCE ?? 'iqmeridian-web';
  }

  private getAccessTokenTtlSeconds(): number {
    const value = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);

    if (!Number.isFinite(value) || value < 60 || value > 3600) {
      return 900;
    }

    return value;
  }

  private getRefreshTokenTtlDays(): number {
    const value = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

    if (!Number.isFinite(value) || value < 1 || value > 90) {
      return 30;
    }

    return value;
  }
}
