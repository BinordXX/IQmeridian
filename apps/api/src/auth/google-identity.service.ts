import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export type VerifiedGoogleIdentity = {
  providerAccountId: string;
  email: string;
  name: string | null;
  emailVerifiedAt: Date;
};

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  async verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException(
        'GOOGLE_CLIENT_ID is not configured.',
      );
    }

    let payload:
      | {
          sub?: string;
          email?: string;
          email_verified?: boolean | string;
          name?: string;
        }
      | undefined;

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google identity token is invalid.');
    }

    const emailVerified =
      payload?.email_verified === true || payload?.email_verified === 'true';

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Google identity token is incomplete.');
    }

    if (!emailVerified) {
      throw new ForbiddenException('Google email address is not verified.');
    }

    return {
      providerAccountId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || null,
      emailVerifiedAt: new Date(),
    };
  }
}
