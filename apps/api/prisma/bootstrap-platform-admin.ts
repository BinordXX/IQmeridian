import { PrismaPg } from '@prisma/adapter-pg';
import {
  AuthProvider,
  AuthSessionStatus,
  Prisma,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { config } from 'dotenv';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env'), override: false });
config({ path: resolve(process.cwd(), '.env.api'), override: false });
config({ path: resolve(process.cwd(), '../../.env'), override: false });
config({ path: resolve(process.cwd(), '../../.env.api'), override: false });

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

type ScryptOptions = typeof SCRYPT_OPTIONS;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function assertPasswordStrength(password: string) {
  if (password.length < 12) {
    throw new Error(
      'PLATFORM_ADMIN_INITIAL_PASSWORD must be at least 12 characters long.',
    );
  }

  if (password.length > 128) {
    throw new Error(
      'PLATFORM_ADMIN_INITIAL_PASSWORD must not exceed 128 characters.',
    );
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
    throw new Error(
      'PLATFORM_ADMIN_INITIAL_PASSWORD must contain uppercase, lowercase, number, and symbol characters.',
    );
  }
}

function scryptWithOptions(
  password: string,
  salt: string,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const scrypt = scryptCallback as unknown as (
      password: string,
      salt: string,
      keyLength: number,
      options: ScryptOptions,
      callback: (error: Error | null, derivedKey: Buffer) => void,
    ) => void;

    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise(derivedKey);
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  assertPasswordStrength(password);

  const pepper = process.env.PASSWORD_PEPPER;
  const passwordWithPepper = pepper ? `${pepper}:${password}` : password;
  const salt = randomBytes(16).toString('base64url');
  const key = await scryptWithOptions(
    passwordWithPepper,
    salt,
    SCRYPT_KEY_LENGTH,
    SCRYPT_OPTIONS,
  );

  return [
    'scrypt',
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    key.toString('base64url'),
  ].join('$');
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  if (process.env.ALLOW_PLATFORM_ADMIN_BOOTSTRAP !== 'true') {
    throw new Error(
      'Refusing to run. Set ALLOW_PLATFORM_ADMIN_BOOTSTRAP=true only for the controlled bootstrap operation.',
    );
  }

  const connectionString = requireEnv('DATABASE_URL');
  const email = requireEnv('PLATFORM_ADMIN_EMAIL').toLowerCase();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';
  const password = requireEnv('PLATFORM_ADMIN_INITIAL_PASSWORD');
  const resetPassword =
    process.env.BOOTSTRAP_PLATFORM_ADMIN_RESET_PASSWORD === 'true';
  const allowAdditionalAdmin =
    process.env.BOOTSTRAP_PLATFORM_ADMIN_ALLOW_ADDITIONAL === 'true';

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const activePlatformAdminCount = await prisma.user.count({
      where: {
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    if (
      !existingUser &&
      activePlatformAdminCount > 0 &&
      !allowAdditionalAdmin
    ) {
      throw new Error(
        'An active platform admin already exists. Refusing to create another through bootstrap unless BOOTSTRAP_PLATFORM_ADMIN_ALLOW_ADDITIONAL=true.',
      );
    }

    if (
      existingUser &&
      existingUser.role !== UserRole.PLATFORM_ADMIN &&
      activePlatformAdminCount > 0
    ) {
      throw new Error(
        'This email belongs to a non-admin user and an active platform admin already exists. Use governed admin role administration instead.',
      );
    }

    const passwordHash =
      !existingUser?.passwordHash || resetPassword
        ? await hashPassword(password)
        : existingUser.passwordHash;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
      create: {
        email,
        name,
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });

    await prisma.authAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.LOCAL,
          providerAccountId: email,
        },
      },
      update: {
        userId: user.id,
        email,
      },
      create: {
        userId: user.id,
        provider: AuthProvider.LOCAL,
        providerAccountId: email,
        email,
      },
    });

    if (existingUser && resetPassword) {
      await prisma.authSession.updateMany({
        where: {
          userId: user.id,
          status: AuthSessionStatus.ACTIVE,
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: new Date(),
          revokedReason: 'PLATFORM_ADMIN_BOOTSTRAP_PASSWORD_RESET',
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: existingUser
          ? 'PLATFORM_ADMIN_BOOTSTRAP_UPDATED'
          : 'PLATFORM_ADMIN_BOOTSTRAP_CREATED',
        userId: user.id,
        entityType: 'User',
        entityId: user.id,
        metadata: toJsonValue({
          email: user.email,
          role: user.role,
          resetPassword,
          allowAdditionalAdmin,
        }),
      },
    });

    console.log('Platform admin bootstrap completed.');
    console.table({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      passwordHashSet: Boolean(user.passwordHash),
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Platform admin bootstrap failed.');
  console.error(error);
  process.exit(1);
});
