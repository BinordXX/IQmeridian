import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type RoleName = `${UserRole}`;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
