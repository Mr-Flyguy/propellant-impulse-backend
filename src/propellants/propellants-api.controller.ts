import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { PropellantsService } from './propellants.service';
import { MinioService } from '../minio/minio.service';
import { RedisService, SessionData } from '../redis/redis.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePropellantDto } from './dto/create-propellant.dto';
import { UpdatePropellantDto } from './dto/update-propellant.dto';
import { PublishPropellantDto } from './dto/publish-propellant.dto';
import { LikePropellantDto } from './dto/like-propellant.dto';
import { PropellantResponseDto } from './dto/propellant-response.dto';

@ApiTags('Propellants (Рабочие тела / Услуги)')
@Controller('api/propellants')
export class PropellantsApiController {
  constructor(
    private readonly propellantsService: PropellantsService,
    private readonly minioService: MinioService,
    private readonly redisService: RedisService,
  ) {}

  private async getOptionalUserId(req: Request): Promise<number | undefined> {
    let sessionId = req.cookies?.sessionId;
    if (!sessionId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Cookie')) {
        sessionId = parts[1];
      } else {
        sessionId = req.headers.authorization;
      }
    }
    if (sessionId) {
      const session = await this.redisService.getSession(sessionId);
      if (session) {
        return session.userId;
      }
    }
    return undefined;
  }

  @Get()
  @ApiOperation({
    summary: 'Получить каталог опубликованных рабочих тел (доступно без авторизации)',
    description:
      'Возвращает список опубликованных рабочих тел. Работает как с авторизацией (указывая is_liked и is_creator), так и для неавторизованных гостей.',
  })
  @ApiQuery({
    name: 'max_molar_mass',
    required: false,
    description: 'Фильтрация по максимальной молярной массе',
    example: 30,
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Поиск по наименованию',
    example: 'метан',
  })
  @ApiResponse({
    status: 200,
    description: 'Список рабочих тел успешно получен',
    type: [PropellantResponseDto],
  })
  async getCatalog(
    @Req() req: Request,
    @Query('max_molar_mass') maxMolarMass?: string,
    @Query('query') query?: string,
  ): Promise<PropellantResponseDto[]> {
    const userId = await this.getOptionalUserId(req);
    const parsedMax = maxMolarMass ? Number(maxMolarMass) : undefined;
    return this.propellantsService.getApiCatalog(userId, parsedMax, query);
  }

  @Get('feed')
  @ApiOperation({
    summary: 'Получить карточку для ленты (доступно без авторизации)',
    description:
      'Возвращает текущую карточку рабочего тела для ленты рекомендаций. Работает без авторизации.',
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Текущий идентификатор рабочего тела',
  })
  @ApiQuery({
    name: 'next',
    required: false,
    description: 'Флаг запроса следующей записи (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Карточка рабочего тела для ленты',
    type: PropellantResponseDto,
  })
  async getFeed(
    @Req() req: Request,
    @Query('id') id?: string,
    @Query('next') next?: string,
  ): Promise<PropellantResponseDto> {
    const userId = await this.getOptionalUserId(req);
    const parsedId = id ? Number(id) : undefined;
    const isNext = next === 'true' || next === '1';
    return this.propellantsService.getApiFeed(userId, parsedId, isNext);
  }

  @Get('draft')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить черновик текущего пользователя (требуется авторизация)',
  })
  @ApiResponse({
    status: 200,
    description: 'Текущий черновик пользователя',
    type: PropellantResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  @ApiResponse({
    status: 404,
    description: 'Черновик для текущего пользователя не найден',
  })
  async getDraft(
    @CurrentUser() user: SessionData,
  ): Promise<PropellantResponseDto> {
    return this.propellantsService.getApiDraft(user.userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary:
      'Создать или обновить черновик рабочего тела (требуется авторизация)',
    description:
      'Поле creator_id автоматически заполняется идентификатором пользователя из текущей сессии Redis.',
  })
  @ApiResponse({
    status: 201,
    description: 'Черновик успешно создан или сохранен',
    type: PropellantResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  async createDraft(
    @Body() dto: CreatePropellantDto,
    @CurrentUser() user: SessionData,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ): Promise<PropellantResponseDto> {
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;

    if (files?.image && files.image[0]) {
      const uploadRes = await this.minioService.uploadFile(
        files.image[0],
        'propellant',
      );
      imageUrl = uploadRes.fileUrl;
    }

    if (files?.video && files.video[0]) {
      const uploadRes = await this.minioService.uploadFile(
        files.video[0],
        'exhaust',
      );
      videoUrl = uploadRes.fileUrl;
    }

    return this.propellantsService.createOrUpdateApiDraft(
      user.userId,
      dto,
      imageUrl,
      videoUrl,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Обновить рабочее тело (услугу) по ID (требуется авторизация)',
    description:
      'Без авторизации возвращает 401 Unauthorized. При наличии валидной сессии обновляет переданные поля и возвращает 200 OK.',
  })
  @ApiResponse({
    status: 200,
    description: 'Рабочее тело успешно обновлено',
    type: PropellantResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (только создатель или администратор)',
  })
  @ApiResponse({
    status: 404,
    description: 'Рабочее тело не найдено',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropellantDto,
    @CurrentUser() user: SessionData,
  ): Promise<PropellantResponseDto> {
    return this.propellantsService.updateApiPropellant(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Put(':id/publish')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Опубликовать черновик рабочего тела (требуется авторизация)',
  })
  @ApiResponse({
    status: 200,
    description: 'Черновик успешно опубликован',
    type: PropellantResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (только создатель или администратор)',
  })
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionData,
    @Body() dto?: PublishPropellantDto,
  ): Promise<PropellantResponseDto> {
    return this.propellantsService.publishApiDraft(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Удалить рабочее тело (soft delete, требуется авторизация)',
  })
  @ApiResponse({
    status: 200,
    description: 'Рабочее тело успешно помечено как удаленное',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (только создатель или администратор)',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: SessionData,
  ): Promise<{ success: boolean; message: string }> {
    return this.propellantsService.deleteApiPropellant(
      id,
      user.userId,
      user.role,
    );
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('sessionId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Поставить или снять отметку "нравится" (требуется авторизация)',
  })
  @ApiResponse({
    status: 200,
    description: 'Отметка "нравится" успешно обновлена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован (отсутствует сессия)',
  })
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikePropellantDto,
    @CurrentUser() user: SessionData,
  ) {
    return this.propellantsService.toggleApiLike(
      id,
      user.userId,
      dto.like,
    );
  }
}
