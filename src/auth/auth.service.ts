import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../propellants/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(dto: RegisterUserDto): Promise<{ id: number; username: string; email: string; message: string }> {
    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException(`Пользователь с логином "${dto.username}" уже существует`);
    }

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException(`Пользователь с email "${dto.email}" уже существует`);
    }

    const newUser = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
    });

    const saved = await this.userRepo.save(newUser);

    return {
      id: saved.id,
      username: saved.username,
      email: saved.email,
      message: 'Пользователь успешно зарегистрирован',
    };
  }

  async login(dto: LoginUserDto): Promise<{ status: string; user: { id: number; username: string }; message: string }> {
    return {
      status: 'ok',
      user: {
        id: 1,
        username: dto.username || 'user_1',
      },
      message: 'Аутентификация успешна',
    };
  }

  async logout(): Promise<{ status: string; message: string }> {
    return {
      status: 'ok',
      message: 'Деавторизация успешна',
    };
  }
}
