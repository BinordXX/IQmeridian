import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../auth/roles.decorator';

// This test only inspects role metadata.
// Avoid loading the JWT guard and its ESM-only jose dependency.
jest.mock('../auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuardStub {},
}));

import { InternalToolingController } from './internal-tooling.controller';

describe('Internal tooling administrative permissions', () => {
  const reflector = new Reflector();

  const administratorOnlyMethods = [
    'createFormalPilotForm',
    'createInternalAssessmentForm',
    'updatePilotFormStatus',
    'createInternalDraftItem',
    'activateInternalItem',
    'updateInternalItemStatus',
    'updateInternalDraftItem',
    'attachInternalItemToForm',
  ] as const;

  it.each(administratorOnlyMethods)(
    '%s requires platform administrator permission',
    (methodName) => {
      const handler = InternalToolingController.prototype[methodName];

      expect(handler).toBeDefined();

      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        handler,
        InternalToolingController,
      ]);

      expect(roles).toEqual(['PLATFORM_ADMIN']);
      expect(roles).not.toContain('RESEARCHER');
    },
  );
});
