import { PrismaPg } from '@prisma/adapter-pg';
import {
  AuthProvider,
  AuthSessionStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { PasswordService } from '../../src/auth/password.service';

const CREATE_CONFIRMATION = 'IQMERIDIAN_CREATE_FIRST_SUPER_ADMIN';
const RESET_CONFIRMATION = 'IQMERIDIAN_RESET_SUPER_ADMIN_PASSWORD';

const command = process.argv[2];

const requireEnv = (key: string) => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
};

const normaliseEmail = (value: string) => value.trim().toLowerCase();

const assertStrongPassword = (password: string) => {
  const failures: string[] = [];

  if (password.length < 16) failures.push('at least 16 characters');
  if (!/[a-z]/.test(password)) failures.push('one lowercase letter');
  if (!/[A-Z]/.test(password)) failures.push('one uppercase letter');
  if (!/[0-9]/.test(password)) failures.push('one number');
  if (!/[^A-Za-z0-9]/.test(password)) failures.push('one symbol');

  if (failures.length > 0) {
    throw new Error(
      `SUPER_ADMIN_PASSWORD is too weak. Required: ${failures.join(', ')}.`,
    );
  }
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const buildPrismaClient = () => {
  const connectionString = requireEnv('DATABASE_URL');

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });
};

const upsertLocalAuthAccount = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    email: string;
    now: Date;
  },
) => {
  await tx.authAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: AuthProvider.LOCAL,
        providerAccountId: input.email,
      },
    },
    create: {
      userId: input.userId,
      provider: AuthProvider.LOCAL,
      providerAccountId: input.email,
      email: input.email,
      emailVerifiedAt: input.now,
    },
    update: {
      userId: input.userId,
      email: input.email,
      emailVerifiedAt: input.now,
    },
  });
};

const revokeActiveSessions = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    reason: string;
    now: Date;
  },
) => {
  await tx.authSession.updateMany({
    where: {
      userId: input.userId,
      status: AuthSessionStatus.ACTIVE,
    },
    data: {
      status: AuthSessionStatus.REVOKED,
      revokedAt: input.now,
      revokedReason: input.reason,
    },
  });
};

const createFirstSuperAdmin = async () => {
  const confirmation = requireEnv('SUPER_ADMIN_BOOTSTRAP_CONFIRM');

  if (confirmation !== CREATE_CONFIRMATION) {
    throw new Error(
      `SUPER_ADMIN_BOOTSTRAP_CONFIRM must be ${CREATE_CONFIRMATION}.`,
    );
  }

  const email = normaliseEmail(requireEnv('SUPER_ADMIN_EMAIL'));
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'IQMeridian Super Admin';
  const password = requireEnv('SUPER_ADMIN_PASSWORD');

  assertStrongPassword(password);

  const prisma = buildPrismaClient();
  const passwordService = new PasswordService();

  try {
    const activeSuperAdminCount = await prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    if (activeSuperAdminCount > 0) {
      throw new Error(
        'An active SUPER_ADMIN already exists. Use reset-password mode.',
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    const passwordHash = await passwordService.hashPassword(password);
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const superAdmin = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              passwordHash,
              role: UserRole.SUPER_ADMIN,
              status: UserStatus.ACTIVE,
              organisationId: null,
              emailVerifiedAt: now,
            },
          })
        : await tx.user.create({
            data: {
              email,
              name,
              passwordHash,
              role: UserRole.SUPER_ADMIN,
              status: UserStatus.ACTIVE,
              organisationId: null,
              emailVerifiedAt: now,
            },
          });

      await upsertLocalAuthAccount(tx, {
        userId: superAdmin.id,
        email,
        now,
      });

      await revokeActiveSessions(tx, {
        userId: superAdmin.id,
        reason: 'super-admin-bootstrap',
        now,
      });

      await tx.auditLog.create({
        data: {
          action: 'SUPER_ADMIN_BOOTSTRAPPED',
          userId: superAdmin.id,
          entityType: 'User',
          entityId: superAdmin.id,
          metadata: toJsonValue({
            email,
            previousUserRole: existingUser?.role ?? null,
            previousUserStatus: existingUser?.status ?? null,
            executionMode: 'local-cli',
          }),
        },
      });

      return superAdmin;
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'create-first-super-admin',
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
};

const resetSuperAdminPassword = async () => {
  const confirmation = requireEnv('SUPER_ADMIN_RESET_CONFIRM');

  if (confirmation !== RESET_CONFIRMATION) {
    throw new Error(`SUPER_ADMIN_RESET_CONFIRM must be ${RESET_CONFIRMATION}.`);
  }

  const email = normaliseEmail(requireEnv('SUPER_ADMIN_EMAIL'));
  const password = requireEnv('SUPER_ADMIN_PASSWORD');

  assertStrongPassword(password);

  const prisma = buildPrismaClient();
  const passwordService = new PasswordService();

  try {
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!existingSuperAdmin) {
      throw new Error('No user exists with SUPER_ADMIN_EMAIL.');
    }

    if (existingSuperAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new Error(
        'Password reset refused. Target user is not a SUPER_ADMIN.',
      );
    }

    const passwordHash = await passwordService.hashPassword(password);
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const updatedSuperAdmin = await tx.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
        },
      });

      await upsertLocalAuthAccount(tx, {
        userId: updatedSuperAdmin.id,
        email,
        now,
      });

      await revokeActiveSessions(tx, {
        userId: updatedSuperAdmin.id,
        reason: 'super-admin-break-glass-password-reset',
        now,
      });

      await tx.auditLog.create({
        data: {
          action: 'SUPER_ADMIN_PASSWORD_RESET_BY_BREAK_GLASS',
          userId: updatedSuperAdmin.id,
          entityType: 'User',
          entityId: updatedSuperAdmin.id,
          metadata: toJsonValue({
            email,
            previousUserStatus: existingSuperAdmin.status,
            executionMode: 'local-cli',
            activeSessionsRevoked: true,
          }),
        },
      });

      return updatedSuperAdmin;
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'reset-super-admin-password',
          userId: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
};

const main = async () => {
  if (command === 'create') {
    await createFirstSuperAdmin();
    return;
  }

  if (command === 'reset-password') {
    await resetSuperAdminPassword();
    return;
  }

  throw new Error('Unsupported command. Use: create or reset-password.');
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Super admin script failed.',
  );
  process.exit(1);
});
