import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Read sessionId from cookie or Authorization header
    let sessionId = request.cookies?.sessionId;
    if (!sessionId && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Cookie')) {
        sessionId = parts[1];
      } else {
        sessionId = request.headers.authorization;
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException('Необходима авторизация (отсутствует sessionId в куках или заголовке)');
    }

    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Сессия недействительна или истекла');
    }

    // Attach user to request
    (request as any).user = session;
    (request as any).sessionId = sessionId;

    return true;
  }
}
