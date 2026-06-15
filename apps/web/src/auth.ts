import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { getApiBaseUrl } from './lib/api-base-url';

type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  organisationId: string | null;
};

type ApiAuthResponse = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken =
    typeof token.refreshToken === 'string' ? token.refreshToken : null;

  if (!refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpiresAt: undefined,
        error: 'RefreshAccessTokenError',
      };
    }

    const data = (await response.json()) as ApiAuthResponse;

    return {
      ...token,
      sub: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      organisationId: data.user.organisationId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpiresAt: undefined,
      error: 'RefreshAccessTokenError',
    };
  }
}

function isAccessTokenStillValid(token: JWT) {
  const expiresAt =
    typeof token.accessTokenExpiresAt === 'string'
      ? Date.parse(token.accessTokenExpiresAt)
      : 0;

  if (!expiresAt) {
    return false;
  }

  return Date.now() < expiresAt - 60_000;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === 'string'
            ? credentials.email.trim().toLowerCase()
            : '';
        const password =
          typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          cache: 'no-store',
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as ApiAuthResponse;

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          organisationId: data.user.organisationId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.organisationId = user.organisationId ?? null;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.error = undefined;

        return token;
      }

      if (isAccessTokenStillValid(token)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role =
          typeof token.role === 'string' ? token.role : undefined;
        session.user.organisationId =
          typeof token.organisationId === 'string'
            ? token.organisationId
            : null;
      }

      session.accessToken =
        typeof token.accessToken === 'string' ? token.accessToken : undefined;
      session.refreshToken =
        typeof token.refreshToken === 'string' ? token.refreshToken : undefined;
      session.accessTokenExpiresAt =
        typeof token.accessTokenExpiresAt === 'string'
          ? token.accessTokenExpiresAt
          : undefined;
      session.error =
        token.error === 'RefreshAccessTokenError'
          ? 'RefreshAccessTokenError'
          : undefined;

      return session;
    },
  },
});
