import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from './request-user.type';

type RequestWithUser = {
  user?: RequestUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
