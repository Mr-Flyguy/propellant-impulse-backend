import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../propellants/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RedisService, SessionData } from '../redis/redis.service';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterUserDto): Promise<{ id: number; username: string; email: string; role: string; message: string }> {
    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException(`Пользователь с логином "${dto.username}" уже существует`);
    }

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException(`Пользователь с email "${dto.email}" уже существует`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: 'user',
    });

    const saved = await this.userRepo.save(newUser);

    return {
      id: saved.id,
      username: saved.username,
      email: saved.email,
      role: saved.role,
      message: 'Пользователь успешно зарегистрирован',
    };
  }

  async login(
    dto: LoginUserDto,
    res: Response,
  ): Promise<{ status: string; sessionId: string; user: { id: number; username: string; email: string; role: string }; message: string }> {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Verify password: check bcrypt hash, fallback to direct compare for seeded fixtures
    let passwordValid = false;
    if (user.password) {
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        passwordValid = await bcrypt.compare(dto.password, user.password);
      } else {
        passwordValid = user.password === dto.password;
      }
    }

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const sessionId = randomUUID();
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      createdAt: new Date().toISOString(),
    };

    // Store in Redis (TTL: 24h = 86400 seconds)
    await this.redisService.setSession(sessionId, sessionData, 86400);

    // Set HTTP-only Cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 86400 * 1000,
      sameSite: 'lax',
    });

    return {
      status: 'ok',
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      },
      message: 'Аутентификация успешна',
    };
  }

  async logout(
    sessionId: string | undefined,
    res: Response,
  ): Promise<{ status: string; message: string }> {
    if (sessionId) {
      await this.redisService.deleteSession(sessionId);
    }
    res.clearCookie('sessionId', { path: '/' });
    return {
      status: 'ok',
      message: 'Деавторизация успешна',
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
    };
  }
}
