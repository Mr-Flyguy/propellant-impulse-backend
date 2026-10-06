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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PropellantsService } from './propellants.service';
import { MinioService } from '../minio/minio.service';
import { CurrentUserService } from '../common/current-user.service';
import { CreatePropellantDto } from './dto/create-propellant.dto';
import { LikePropellantDto } from './dto/like-propellant.dto';
import { PropellantResponseDto } from './dto/propellant-response.dto';

@Controller('api/propellants')
export class PropellantsApiController {
  constructor(
    private readonly propellantsService: PropellantsService,
    private readonly minioService: MinioService,
    private readonly currentUserService: CurrentUserService,
  ) {}

  @Get()
  async getCatalog(
    @Query('max_molar_mass') maxMolarMass?: string,
    @Query('query') query?: string,
  ): Promise<PropellantResponseDto[]> {
    const currentUser = this.currentUserService.getCurrentUser();
    const parsedMax = maxMolarMass ? Number(maxMolarMass) : undefined;
    return this.propellantsService.getApiCatalog(
      currentUser.id,
      parsedMax,
      query,
    );
  }

  @Get('feed')
  async getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const currentUser = this.currentUserService.getCurrentUser();
    const parsedId = id ? Number(id) : undefined;
    const isNext = next === 'true' || next === '1';
    return this.propellantsService.getApiFeed(
      currentUser.id,
      parsedId,
      isNext,
    );
  }

  @Get('draft')
  async getDraft(): Promise<PropellantResponseDto> {
    const currentUser = this.currentUserService.getCurrentUser();
    return this.propellantsService.getApiDraft(currentUser.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async createDraft(
    @Body() dto: CreatePropellantDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
  ): Promise<PropellantResponseDto> {
    const currentUser = this.currentUserService.getCurrentUser();

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
      currentUser.id,
      dto,
      imageUrl,
      videoUrl,
    );
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PropellantResponseDto> {
    const currentUser = this.currentUserService.getCurrentUser();
    return this.propellantsService.publishApiDraft(id, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    const currentUser = this.currentUserService.getCurrentUser();
    return this.propellantsService.deleteApiPropellant(id, currentUser.id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikePropellantDto,
  ) {
    const currentUser = this.currentUserService.getCurrentUser();
    return this.propellantsService.toggleApiLike(id, currentUser.id, dto.like);
  }
}
