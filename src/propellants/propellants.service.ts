import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Propellant } from './entities/propellant.entity';
import { User } from './entities/user.entity';
import { PropellantLike } from './entities/propellant-like.entity';
import { CurrentUserService } from '../common/current-user.service';
import { CreatePropellantDto } from './dto/create-propellant.dto';
import { PropellantResponseDto } from './dto/propellant-response.dto';

export interface FeedResult {
  current: Propellant & { likesCount: number };
  next_id: number;
}

export interface SavePropellantDto {
  name?: string;
  chemicalFormula?: string;
  shortDescription?: string;
  engineeringAnalysis?: string;
  molarMass?: number;
  reactorTemperatureK?: number;
  specificHeatRatio?: number;
  specificImpulse?: number;
  imageUrl?: string;
  videoUrl?: string;
}

@Injectable()
export class PropellantsService {
  private readonly defaultImageUrl = '/img/default_propellant.jpg';
  private readonly defaultVideoUrl = '/video/default_exhaust.mp4';

  constructor(
    @InjectRepository(Propellant)
    private readonly propellantRepo: Repository<Propellant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PropellantLike)
    private readonly likeRepo: Repository<PropellantLike>,
    private readonly dataSource: DataSource,
    private readonly currentUserService: CurrentUserService,
  ) {}

  private mapMedia(
    item: Propellant,
  ): Propellant & { likesCount: number; imageKey: string; videoKey: string } {
    const rawImageUrl =
      item.imageUrl && item.imageUrl.trim() !== ''
        ? item.imageUrl
        : this.defaultImageUrl;
    const rawVideoUrl =
      item.videoUrl && item.videoUrl.trim() !== ''
        ? item.videoUrl
        : this.defaultVideoUrl;
    const imageKey =
      rawImageUrl.split('/').pop()?.split('?')[0] || 'propellant_ch4.jpg';
    const videoKey =
      rawVideoUrl.split('/').pop()?.split('?')[0] || 'video_exhaust_ch4.mp4';
    const videoUrl = rawVideoUrl.includes('?')
      ? rawVideoUrl
      : `${rawVideoUrl}?v=2`;

    const molarMass =
      item.molarMass !== null && item.molarMass !== undefined
        ? Number(item.molarMass)
        : item.molarMass;
    const specificHeatRatio =
      item.specificHeatRatio !== null && item.specificHeatRatio !== undefined
        ? Number(item.specificHeatRatio)
        : item.specificHeatRatio;

    return {
      ...item,
      imageUrl: rawImageUrl,
      videoUrl,
      imageKey,
      videoKey,
      molarMass,
      specificHeatRatio,
      likesCount: item.likes ? item.likes.length : 0,
    };
  }

  // ==========================================
  // SSR METHODS (preserved for UI backward compat)
  // ==========================================

  async getFeedItem(id?: number): Promise<FeedResult | null> {
    let current: Propellant | null = null;

    if (id) {
      current = await this.propellantRepo.findOne({
        where: { id, status: 'published' },
        relations: ['likes'],
      });
    }

    if (!current) {
      current = await this.propellantRepo.findOne({
        where: { status: 'published' },
        order: { id: 'ASC' },
        relations: ['likes'],
      });
    }

    if (!current) {
      return null;
    }

    const nextItem = await this.propellantRepo.findOne({
      where: { status: 'published', id: MoreThan(current.id) },
      order: { id: 'ASC' },
      select: ['id'],
    });

    const nextId = nextItem
      ? nextItem.id
      : (
          await this.propellantRepo.findOne({
            where: { status: 'published' },
            order: { id: 'ASC' },
            select: ['id'],
          })
        )?.id ?? current.id;

    return {
      current: this.mapMedia(current),
      next_id: nextId,
    };
  }

  async getCatalogItems(
    maxMolarMass?: number,
  ): Promise<Array<Propellant & { likesCount: number }>> {
    const qb = this.propellantRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.likes', 'like')
      .where('p.status = :status', { status: 'published' })
      .orderBy('p.id', 'ASC');

    if (maxMolarMass !== undefined && !isNaN(maxMolarMass)) {
      qb.andWhere('p.molarMass <= :max', { max: maxMolarMass });
    }

    const items = await qb.getMany();
    return items.map((item) => this.mapMedia(item));
  }

  async getUserDraft(userId: number): Promise<Propellant | null> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: userId, status: 'draft' },
    });
    if (!draft) return null;
    return this.mapMedia(draft);
  }

  async saveUserDraft(
    userId: number,
    dto: SavePropellantDto,
  ): Promise<Propellant> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: userId, status: 'draft' },
    });

    if (draft) {
      if (dto.name) draft.name = dto.name;
      if (dto.chemicalFormula !== undefined)
        draft.chemicalFormula = dto.chemicalFormula;
      if (dto.shortDescription !== undefined)
        draft.shortDescription = dto.shortDescription;
      if (dto.engineeringAnalysis !== undefined)
        draft.engineeringAnalysis = dto.engineeringAnalysis;
      if (dto.imageUrl !== undefined) draft.imageUrl = dto.imageUrl;
      if (dto.videoUrl !== undefined) draft.videoUrl = dto.videoUrl;
      if (dto.molarMass !== undefined && !isNaN(dto.molarMass))
        draft.molarMass = dto.molarMass;
      if (
        dto.reactorTemperatureK !== undefined &&
        !isNaN(dto.reactorTemperatureK)
      )
        draft.reactorTemperatureK = dto.reactorTemperatureK;
      if (
        dto.specificHeatRatio !== undefined &&
        !isNaN(dto.specificHeatRatio)
      )
        draft.specificHeatRatio = dto.specificHeatRatio;
      if (dto.specificImpulse !== undefined && !isNaN(dto.specificImpulse))
        draft.specificImpulse = dto.specificImpulse;
      draft.updatedAt = new Date();
      return await this.propellantRepo.save(draft);
    }

    const newDraft = this.propellantRepo.create({
      name: dto.name || 'Новое рабочее тело',
      chemicalFormula: dto.chemicalFormula || 'LCH₄',
      shortDescription: dto.shortDescription || '',
      engineeringAnalysis: dto.engineeringAnalysis || '',
      status: 'draft',
      imageUrl: dto.imageUrl || this.defaultImageUrl,
      videoUrl: dto.videoUrl || this.defaultVideoUrl,
      molarMass: dto.molarMass ?? 16.04,
      reactorTemperatureK: dto.reactorTemperatureK ?? 2600,
      specificHeatRatio: dto.specificHeatRatio ?? 1.32,
      specificImpulse: dto.specificImpulse ?? 630,
      creatorId: userId,
    });

    return await this.propellantRepo.save(newDraft);
  }

  async publishDraft(
    userId: number,
    dto: SavePropellantDto,
  ): Promise<Propellant> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: userId, status: 'draft' },
    });

    if (draft) {
      if (dto.name) draft.name = dto.name;
      if (dto.chemicalFormula !== undefined)
        draft.chemicalFormula = dto.chemicalFormula;
      if (dto.shortDescription !== undefined)
        draft.shortDescription = dto.shortDescription;
      if (dto.engineeringAnalysis !== undefined)
        draft.engineeringAnalysis = dto.engineeringAnalysis;
      if (dto.imageUrl !== undefined) draft.imageUrl = dto.imageUrl;
      if (dto.videoUrl !== undefined) draft.videoUrl = dto.videoUrl;
      if (dto.molarMass !== undefined && !isNaN(dto.molarMass))
        draft.molarMass = dto.molarMass;
      if (
        dto.reactorTemperatureK !== undefined &&
        !isNaN(dto.reactorTemperatureK)
      )
        draft.reactorTemperatureK = dto.reactorTemperatureK;
      if (
        dto.specificHeatRatio !== undefined &&
        !isNaN(dto.specificHeatRatio)
      )
        draft.specificHeatRatio = dto.specificHeatRatio;
      if (dto.specificImpulse !== undefined && !isNaN(dto.specificImpulse))
        draft.specificImpulse = dto.specificImpulse;
      draft.status = 'published';
      draft.updatedAt = new Date();
      return await this.propellantRepo.save(draft);
    }

    const newPropellant = this.propellantRepo.create({
      name: dto.name || 'Новое рабочее тело',
      chemicalFormula: dto.chemicalFormula || 'LCH₄',
      shortDescription: dto.shortDescription || '',
      engineeringAnalysis: dto.engineeringAnalysis || '',
      status: 'published',
      imageUrl: dto.imageUrl || this.defaultImageUrl,
      videoUrl: dto.videoUrl || this.defaultVideoUrl,
      molarMass: dto.molarMass ?? 16.04,
      reactorTemperatureK: dto.reactorTemperatureK ?? 2600,
      specificHeatRatio: dto.specificHeatRatio ?? 1.32,
      specificImpulse: dto.specificImpulse ?? 630,
      creatorId: userId,
    });

    return await this.propellantRepo.save(newPropellant);
  }

  async deletePropellantRaw(id: number): Promise<void> {
    await this.dataSource.query(
      'UPDATE propellants SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id],
    );
  }

  // ==========================================
  // REST API METHODS (Laboratory Work 3)
  // ==========================================

  async getApiCatalog(
    currentUserId: number,
    maxMolarMass?: number,
    query?: string,
  ): Promise<PropellantResponseDto[]> {
    const qb = this.propellantRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.likes', 'like')
      .where('p.status = :status', { status: 'published' })
      .orderBy('p.id', 'ASC');

    if (maxMolarMass !== undefined && !isNaN(maxMolarMass)) {
      qb.andWhere('p.molarMass <= :max', { max: maxMolarMass });
    }

    if (query && query.trim() !== '') {
      qb.andWhere('LOWER(p.name) LIKE LOWER(:q)', { q: `%${query.trim()}%` });
    }

    const items = await qb.getMany();
    return items.map((item) =>
      PropellantResponseDto.fromEntity(item, currentUserId),
    );
  }

  async getApiFeed(
    currentUserId: number,
    id?: number,
    next?: boolean,
  ): Promise<{ item: PropellantResponseDto; next_id: number } | null> {
    let current: Propellant | null = null;

    if (id && next) {
      current = await this.propellantRepo.findOne({
        where: { status: 'published', id: MoreThan(id) },
        order: { id: 'ASC' },
        relations: ['likes'],
      });
    } else if (id) {
      current = await this.propellantRepo.findOne({
        where: { id, status: 'published' },
        relations: ['likes'],
      });
    }

    if (!current) {
      current = await this.propellantRepo.findOne({
        where: { status: 'published' },
        order: { id: 'ASC' },
        relations: ['likes'],
      });
    }

    if (!current) {
      return null;
    }

    const nextItem = await this.propellantRepo.findOne({
      where: { status: 'published', id: MoreThan(current.id) },
      order: { id: 'ASC' },
      select: ['id'],
    });

    const nextId = nextItem
      ? nextItem.id
      : (
          await this.propellantRepo.findOne({
            where: { status: 'published' },
            order: { id: 'ASC' },
            select: ['id'],
          })
        )?.id ?? current.id;

    return {
      item: PropellantResponseDto.fromEntity(current, currentUserId),
      next_id: nextId,
    };
  }

  async getApiDraft(currentUserId: number): Promise<PropellantResponseDto> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: currentUserId, status: 'draft' },
      relations: ['likes'],
    });

    if (!draft) {
      throw new NotFoundException('Черновик для текущего пользователя не найден');
    }

    return PropellantResponseDto.fromEntity(draft, currentUserId);
  }

  async createOrUpdateApiDraft(
    currentUserId: number,
    dto: CreatePropellantDto,
    imageUrl?: string,
    videoUrl?: string,
  ): Promise<PropellantResponseDto> {
    const parsedMolarMass =
      dto.molar_mass !== undefined && dto.molar_mass !== null && dto.molar_mass !== ''
        ? Number(String(dto.molar_mass).replace(',', '.'))
        : undefined;

    const parsedGamma =
      dto.specific_heat_ratio !== undefined &&
      dto.specific_heat_ratio !== null &&
      dto.specific_heat_ratio !== ''
        ? Number(String(dto.specific_heat_ratio).replace(',', '.'))
        : undefined;

    let draft = await this.propellantRepo.findOne({
      where: { creatorId: currentUserId, status: 'draft' },
      relations: ['likes'],
    });

    if (draft) {
      if (dto.name) draft.name = dto.name;
      if (dto.short_description !== undefined)
        draft.shortDescription = dto.short_description;
      if (parsedMolarMass !== undefined && !isNaN(parsedMolarMass))
        draft.molarMass = parsedMolarMass;
      if (parsedGamma !== undefined && !isNaN(parsedGamma))
        draft.specificHeatRatio = parsedGamma;
      if (imageUrl) draft.imageUrl = imageUrl;
      if (videoUrl) draft.videoUrl = videoUrl;
      draft.updatedAt = new Date();
      draft = await this.propellantRepo.save(draft);
    } else {
      draft = this.propellantRepo.create({
        name: dto.name || 'Новое рабочее тело',
        shortDescription: dto.short_description || '',
        molarMass: parsedMolarMass ?? 16.04,
        specificHeatRatio: parsedGamma ?? 1.32,
        status: 'draft',
        imageUrl: imageUrl || this.defaultImageUrl,
        videoUrl: videoUrl || this.defaultVideoUrl,
        specificImpulse: 630,
        creatorId: currentUserId,
      });
      draft = await this.propellantRepo.save(draft);
    }

    return PropellantResponseDto.fromEntity(draft, currentUserId);
  }

  async publishApiDraft(
    id: number,
    currentUserId: number,
  ): Promise<PropellantResponseDto> {
    const propellant = await this.propellantRepo.findOne({
      where: { id },
      relations: ['likes'],
    });

    if (!propellant) {
      throw new NotFoundException(`Рабочее тело с ID ${id} не найдено`);
    }

    if (propellant.creatorId !== currentUserId) {
      throw new ForbiddenException(
        'Только создатель может опубликовать данный черновик',
      );
    }

    if (propellant.status !== 'draft') {
      throw new BadRequestException(
        'Опубликовать можно только запись в статусе "draft"',
      );
    }

    propellant.status = 'published';
    propellant.updatedAt = new Date();
    const saved = await this.propellantRepo.save(propellant);

    return PropellantResponseDto.fromEntity(saved, currentUserId);
  }

  async deleteApiPropellant(
    id: number,
    currentUserId: number,
  ): Promise<{ success: boolean; message: string }> {
    const propellant = await this.propellantRepo.findOne({
      where: { id },
    });

    if (!propellant) {
      throw new NotFoundException(`Рабочее тело с ID ${id} не найдено`);
    }

    if (propellant.creatorId !== currentUserId) {
      throw new ForbiddenException('Только создатель может удалить данную услугу');
    }

    propellant.status = 'deleted';
    propellant.updatedAt = new Date();
    await this.propellantRepo.save(propellant);

    return {
      success: true,
      message: `Услуга с ID ${id} успешно удалена (soft delete)`,
    };
  }

  async toggleApiLike(
    id: number,
    currentUserId: number,
    likeAction: number | boolean | string,
  ): Promise<{ success: boolean; liked: number; likes_count: number }> {
    const propellant = await this.propellantRepo.findOne({
      where: { id },
    });

    if (!propellant) {
      throw new NotFoundException(`Рабочее тело с ID ${id} не найдено`);
    }

    if (propellant.status !== 'published') {
      throw new BadRequestException(
        'Поставить отметку "нравится" можно только опубликованной услуге',
      );
    }

    const isAdding =
      likeAction === 1 ||
      likeAction === '1' ||
      likeAction === true ||
      likeAction === 'true';

    const existingLike = await this.likeRepo.findOne({
      where: { userId: currentUserId, propellantId: id },
    });

    if (isAdding) {
      if (!existingLike) {
        await this.likeRepo.save(
          this.likeRepo.create({ userId: currentUserId, propellantId: id }),
        );
      }
    } else {
      if (existingLike) {
        await this.likeRepo.delete({
          userId: currentUserId,
          propellantId: id,
        });
      }
    }

    const newLikesCount = await this.likeRepo.count({
      where: { propellantId: id },
    });

    return {
      success: true,
      liked: isAdding ? 1 : 0,
      likes_count: newLikesCount,
    };
  }
}
