import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SessionData } from '../redis/redis.service';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('Домен пользователей')
@Controller('api/auth')
export class AuthApiController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация нового пользователя', description: 'Создает учетную запись инженера с ролью user' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким логином или email уже существует' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентификация пользователя (Вход)', description: 'Проверяет учетные данные, создает сессию в Redis и устанавливает сессионную куку sessionId' })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация, возвращает sessionId и данные пользователя' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  async login(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Деавторизация пользователя (Выход)', description: 'Удаляет сессию из Redis и очищает сессионную куку sessionId' })
  @ApiResponse({ status: 200, description: 'Деавторизация успешна' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.sessionId || (req as any).sessionId;
    return this.authService.logout(sessionId, res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Получение профиля текущего авторизованного пользователя', description: 'Требует валидной сессии sessionId' })
  @ApiResponse({ status: 200, description: 'Данные текущего инженера' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMe(@CurrentUser() user: SessionData) {
    return this.authService.getMe(user.userId);
  }
}
