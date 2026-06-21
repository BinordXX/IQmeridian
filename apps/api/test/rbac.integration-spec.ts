import {
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  INestApplication,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { Roles } from '../src/auth/roles.decorator';
import { RolesGuard } from '../src/auth/roles.guard';

type TestRole =
  | 'CONSUMER'
  | 'CANDIDATE'
  | 'EMPLOYER_ADMIN'
  | 'RESEARCHER'
  | 'PLATFORM_ADMIN';

type TestUser = {
  id: string;
  email: string;
  role: TestRole;
  organisationId: string | null;
};

type RequestWithTestUser = Request & {
  user: TestUser;
};

const candidateOwnedSessionId = 'candidate-session-1';
const candidateOwnedResultId = 'candidate-result-1';
const anotherCandidateResultId = 'candidate-result-2';

const consumerOwnedResultId = 'consumer-result-1';

const employerOrganisationId = 'organisation-1';
const otherOrganisationId = 'organisation-2';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const requestObject = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: TestUser;
    }>();

    const role = this.normaliseHeader(requestObject.headers['x-test-role']);
    const userId = this.normaliseHeader(
      requestObject.headers['x-test-user-id'],
    );
    const organisationId = this.normaliseHeader(
      requestObject.headers['x-test-organisation-id'],
    );

    if (!role || !userId) {
      throw new UnauthorizedException('Authentication is required.');
    }

    requestObject.user = {
      id: userId,
      email: `${userId}@iqmeridian.test`,
      role: role as TestRole,
      organisationId: organisationId || null,
    };

    return true;
  }

  private normaliseHeader(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}

@Controller('rbac-test')
@UseGuards(TestAuthGuard, RolesGuard)
class RbacPolicyTestController {
  @Get('dashboard')
  @Roles(
    'CONSUMER',
    'CANDIDATE',
    'EMPLOYER_ADMIN',
    'RESEARCHER',
    'PLATFORM_ADMIN',
  )
  dashboard() {
    return { ok: true };
  }

  @Get('internal/admin')
  @Roles('PLATFORM_ADMIN')
  internalAdmin() {
    return { ok: true };
  }

  @Get('internal/researcher')
  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  researcherTools() {
    return { ok: true };
  }

  @Post('internal/exports/requests')
  @Roles('PLATFORM_ADMIN', 'RESEARCHER')
  requestExport() {
    return { ok: true };
  }

  @Patch('internal/exports/requests/:requestId/review')
  @Roles('PLATFORM_ADMIN')
  reviewExportRequest(@Param('requestId') requestId: string) {
    return { ok: true, requestId };
  }

  @Post('internal/exports/direct')
  @Roles('PLATFORM_ADMIN')
  directExport() {
    return { ok: true };
  }

  @Get('internal/exports/requests/:requestId/download')
  @Roles('PLATFORM_ADMIN')
  downloadExportRequest(@Param('requestId') requestId: string) {
    return { ok: true, requestId };
  }

  @Patch('users/:userId/role')
  @Roles('PLATFORM_ADMIN')
  assignUserRole(@Param('userId') userId: string) {
    return { ok: true, userId };
  }

  @Get('employer/dashboard')
  @Roles('EMPLOYER_ADMIN')
  employerDashboard() {
    return { ok: true };
  }

  @Get('employer/organisations/:organisationId/campaigns')
  @Roles('EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  employerOrganisationCampaigns(
    @Req() requestObject: RequestWithTestUser,
    @Param('organisationId') organisationId: string,
  ) {
    this.assertOrganisationAccess(requestObject.user, organisationId);

    return { ok: true, organisationId };
  }

  @Get('employer/organisations/:organisationId/reports')
  @Roles('EMPLOYER_ADMIN', 'PLATFORM_ADMIN')
  employerOrganisationReports(
    @Req() requestObject: RequestWithTestUser,
    @Param('organisationId') organisationId: string,
  ) {
    this.assertOrganisationAccess(requestObject.user, organisationId);

    return { ok: true, organisationId };
  }

  @Get('assessment/sessions/:sessionId')
  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  assessmentSession(
    @Req() requestObject: RequestWithTestUser,
    @Param('sessionId') sessionId: string,
  ) {
    this.assertAssessmentOwnership(requestObject.user, sessionId);

    return { ok: true, sessionId };
  }

  @Get('results/:resultId')
  @Roles('CANDIDATE', 'CONSUMER', 'PLATFORM_ADMIN')
  protectedResult(
    @Req() requestObject: RequestWithTestUser,
    @Param('resultId') resultId: string,
  ) {
    this.assertResultOwnership(requestObject.user, resultId);

    return { ok: true, resultId };
  }

  private assertOrganisationAccess(user: TestUser, organisationId: string) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      user.role === 'EMPLOYER_ADMIN' &&
      user.organisationId === organisationId
    ) {
      return;
    }

    throw new ForbiddenException('Organisation access is denied.');
  }

  private assertAssessmentOwnership(user: TestUser, sessionId: string) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      user.role === 'CANDIDATE' &&
      user.id === 'candidate-user-1' &&
      sessionId === candidateOwnedSessionId
    ) {
      return;
    }

    if (
      user.role === 'CONSUMER' &&
      user.id === 'consumer-user-1' &&
      sessionId === 'consumer-session-1'
    ) {
      return;
    }

    throw new ForbiddenException('Assessment session access is denied.');
  }

  private assertResultOwnership(user: TestUser, resultId: string) {
    if (user.role === 'PLATFORM_ADMIN') {
      return;
    }

    if (
      user.role === 'CANDIDATE' &&
      user.id === 'candidate-user-1' &&
      resultId === candidateOwnedResultId
    ) {
      return;
    }

    if (
      user.role === 'CONSUMER' &&
      user.id === 'consumer-user-1' &&
      resultId === consumerOwnedResultId
    ) {
      return;
    }

    throw new ForbiddenException('Result access is denied.');
  }
}

const authHeaders = ({
  role,
  userId,
  organisationId,
}: {
  role: TestRole;
  userId: string;
  organisationId?: string;
}) => {
  return {
    'x-test-role': role,
    'x-test-user-id': userId,
    ...(organisationId
      ? {
          'x-test-organisation-id': organisationId,
        }
      : {}),
  };
};

describe('RBAC integration policy', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RbacPolicyTestController],
      providers: [Reflector, RolesGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Anonymous', () => {
    it('cannot access internal tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .expect(401);
    });

    it('cannot access employer dashboard', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/employer/dashboard')
        .expect(401);
    });

    it('cannot access protected assessment result', async () => {
      await request(app.getHttpServer())
        .get(`/rbac-test/results/${candidateOwnedResultId}`)
        .expect(401);
    });
  });

  describe('CONSUMER', () => {
    const consumer = authHeaders({
      role: 'CONSUMER',
      userId: 'consumer-user-1',
    });

    it('can access own dashboard', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/dashboard')
        .set(consumer)
        .expect(200);
    });

    it('cannot access internal tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .set(consumer)
        .expect(403);
    });

    it('cannot access employer dashboard', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/employer/dashboard')
        .set(consumer)
        .expect(403);
    });

    it('cannot access admin tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/admin')
        .set(consumer)
        .expect(403);
    });
  });

  describe('CANDIDATE', () => {
    const candidate = authHeaders({
      role: 'CANDIDATE',
      userId: 'candidate-user-1',
    });

    it('can access assigned assessment session', async () => {
      await request(app.getHttpServer())
        .get(`/rbac-test/assessment/sessions/${candidateOwnedSessionId}`)
        .set(candidate)
        .expect(200);
    });

    it('can access assigned result', async () => {
      await request(app.getHttpServer())
        .get(`/rbac-test/results/${candidateOwnedResultId}`)
        .set(candidate)
        .expect(200);
    });

    it('cannot access another candidate result', async () => {
      await request(app.getHttpServer())
        .get(`/rbac-test/results/${anotherCandidateResultId}`)
        .set(candidate)
        .expect(403);
    });

    it('cannot access internal tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .set(candidate)
        .expect(403);
    });

    it('cannot access employer dashboard', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/employer/dashboard')
        .set(candidate)
        .expect(403);
    });
  });

  describe('EMPLOYER_ADMIN', () => {
    const employerAdmin = authHeaders({
      role: 'EMPLOYER_ADMIN',
      userId: 'employer-admin-user-1',
      organisationId: employerOrganisationId,
    });

    it('can access own organisation campaigns', async () => {
      await request(app.getHttpServer())
        .get(
          `/rbac-test/employer/organisations/${employerOrganisationId}/campaigns`,
        )
        .set(employerAdmin)
        .expect(200);
    });

    it('can access own organisation reports', async () => {
      await request(app.getHttpServer())
        .get(
          `/rbac-test/employer/organisations/${employerOrganisationId}/reports`,
        )
        .set(employerAdmin)
        .expect(200);
    });

    it('cannot access another organisation', async () => {
      await request(app.getHttpServer())
        .get(`/rbac-test/employer/organisations/${otherOrganisationId}/reports`)
        .set(employerAdmin)
        .expect(403);
    });

    it('cannot access internal admin tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/admin')
        .set(employerAdmin)
        .expect(403);
    });

    it('cannot access researcher tools', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .set(employerAdmin)
        .expect(403);
    });
  });

  describe('RESEARCHER', () => {
    const researcher = authHeaders({
      role: 'RESEARCHER',
      userId: 'researcher-user-1',
    });

    it('can access researcher tools', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .set(researcher)
        .expect(200);
    });

    it('can request exports', async () => {
      await request(app.getHttpServer())
        .post('/rbac-test/internal/exports/requests')
        .set(researcher)
        .expect(201);
    });

    it('cannot approve exports', async () => {
      await request(app.getHttpServer())
        .patch('/rbac-test/internal/exports/requests/export-request-1/review')
        .set(researcher)
        .expect(403);
    });

    it('cannot direct export', async () => {
      await request(app.getHttpServer())
        .post('/rbac-test/internal/exports/direct')
        .set(researcher)
        .expect(403);
    });

    it('cannot administer users or roles', async () => {
      await request(app.getHttpServer())
        .patch('/rbac-test/users/user-1/role')
        .set(researcher)
        .expect(403);
    });
  });

  describe('PLATFORM_ADMIN', () => {
    const platformAdmin = authHeaders({
      role: 'PLATFORM_ADMIN',
      userId: 'platform-admin-user-1',
    });

    it('can access admin tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/admin')
        .set(platformAdmin)
        .expect(200);
    });

    it('can approve or decline exports', async () => {
      await request(app.getHttpServer())
        .patch('/rbac-test/internal/exports/requests/export-request-1/review')
        .set(platformAdmin)
        .expect(200);
    });

    it('can generate direct exports', async () => {
      await request(app.getHttpServer())
        .post('/rbac-test/internal/exports/direct')
        .set(platformAdmin)
        .expect(201);
    });

    it('can download generated exports', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/exports/requests/export-request-1/download')
        .set(platformAdmin)
        .expect(200);
    });

    it('can assign roles', async () => {
      await request(app.getHttpServer())
        .patch('/rbac-test/users/user-1/role')
        .set(platformAdmin)
        .expect(200);
    });

    it('can access researcher tooling', async () => {
      await request(app.getHttpServer())
        .get('/rbac-test/internal/researcher')
        .set(platformAdmin)
        .expect(200);
    });
  });
});
