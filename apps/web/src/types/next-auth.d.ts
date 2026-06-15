import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      organisationId?: string | null;
    };
  }

  interface User {
    role?: string;
    organisationId?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    organisationId?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
  }
}
