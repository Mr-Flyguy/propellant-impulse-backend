import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionData } from '../../redis/redis.service';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SessionData | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
