import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

type AppRole =
  | 'PLATFORM_ADMIN'
  | 'RESEARCHER'
  | 'EMPLOYER_ADMIN'
  | 'CANDIDATE'
  | 'CONSUMER';

type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  status: string;
  organisationId: string | null;
  organisationName: string | null;
};

type ApiAuthResponse = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
    error?: 'RefreshAccessTokenError';
    user: {
      id: string;
      role?: AppRole;
      organisationId?: string | null;
      organisationName?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: AppRole;
    organisationId?: string | null;
    organisationName?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppRole;
    organisationId?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
    error?: 'RefreshAccessTokenError';
  }
}

const normaliseBaseUrl = (baseUrl: string) => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = () => {
  return normaliseBaseUrl(
    process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
  );
};

const isAppRole = (value: unknown): value is AppRole => {
  return (
    value === 'PLATFORM_ADMIN' ||
    value === 'RESEARCHER' ||
    value === 'EMPLOYER_ADMIN' ||
    value === 'CANDIDATE' ||
    value === 'CONSUMER'
  );
};

const isAccessTokenStillUsable = (accessTokenExpiresAt?: string) => {
  if (!accessTokenExpiresAt) return false;

  const expiresAt = Date.parse(accessTokenExpiresAt);

  if (!Number.isFinite(expiresAt)) return false;

  return Date.now() < expiresAt - 30_000;
};

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  if (!token.refreshToken) {
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
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }

    const data = (await response.json()) as ApiAuthResponse;

    return {
      ...token,
      sub: data.user.id,
      name: data.user.name,
      email: data.user.email,
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
      error: 'RefreshAccessTokenError',
    };
  }
};

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
  organisationName: data.user.organisationName,
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
  accessTokenExpiresAt: data.accessTokenExpiresAt,
};
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role = isAppRole(user.role) ? user.role : undefined;
        token.organisationId = user.organisationId ?? null;
        token.organisationName = user.organisationName ?? null;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.error = undefined;

        return token;
      }
      if (trigger === 'update') {
        const nextSession = session as {
          user?: {
            name?: unknown;
          };
        };

        if (typeof nextSession.user?.name === 'string') {
          token.name = nextSession.user.name;
        }
      }
      if (
        token.accessToken &&
        isAccessTokenStillUsable(token.accessTokenExpiresAt)
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? '';
            session.user.name =
        typeof token.name === 'string' ? token.name : session.user.name;
      session.user.email =
        typeof token.email === 'string' ? token.email : session.user.email;
      session.user.role = isAppRole(token.role) ? token.role : undefined;
      session.user.organisationId =
        typeof token.organisationId === 'string' ? token.organisationId : null;
        session.user.organisationName =
  typeof token.organisationName === 'string'
    ? token.organisationName
    : null;

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
