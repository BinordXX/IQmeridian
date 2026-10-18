import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { RolesGuard } from './roles.guard';

class TestController {}

function testHandler() {
  return undefined;
}

const makeContext = (user?: unknown): ExecutionContext =>
  ({
    getHandler: () => testHandler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

const makeGuard = (requiredRoles?: UserRole[]): RolesGuard => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
};

describe('RolesGuard security regression tests', () => {
  it('allows a user with a required role', () => {
    const guard = makeGuard([UserRole.CONSUMER]);

    expect(guard.canActivate(makeContext({ roles: [UserRole.CONSUMER] }))).toBe(
      true,
    );
  });

  it('denies a user without the required role', () => {
    const guard = makeGuard([UserRole.PLATFORM_ADMIN]);

    expect(guard.canActivate(makeContext({ roles: [UserRole.CONSUMER] }))).toBe(
      false,
    );
  });

  it('allows Super Admin to access a role-protected endpoint', () => {
    const guard = makeGuard([UserRole.PLATFORM_ADMIN]);

    expect(
      guard.canActivate(makeContext({ roles: [UserRole.SUPER_ADMIN] })),
    ).toBe(true);
  });

  it('denies an authenticated user with missing roles', () => {
    const guard = makeGuard([UserRole.PLATFORM_ADMIN]);

    expect(
      guard.canActivate(makeContext({ role: UserRole.PLATFORM_ADMIN })),
    ).toBe(false);
  });

  it('denies malformed roles represented as a string', () => {
    const guard = makeGuard([UserRole.PLATFORM_ADMIN]);

    expect(
      guard.canActivate(makeContext({ roles: UserRole.PLATFORM_ADMIN })),
    ).toBe(false);
  });

  it('denies an empty role array', () => {
    const guard = makeGuard([UserRole.RESEARCHER]);

    expect(guard.canActivate(makeContext({ roles: [] }))).toBe(false);
  });

  it('denies access when the request has no user', () => {
    const guard = makeGuard([UserRole.CONSUMER]);

    expect(guard.canActivate(makeContext())).toBe(false);
  });

  it('does not impose role restrictions on an endpoint without role metadata', () => {
    const guard = makeGuard();

    expect(guard.canActivate(makeContext())).toBe(true);
  });
});
