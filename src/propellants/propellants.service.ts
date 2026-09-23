import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Propellant } from './entities/propellant.entity';
import { User } from './entities/user.entity';

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
    private readonly dataSource: DataSource,
  ) {}

  private mapMedia(item: Propellant): Propellant & { likesCount: number; imageKey: string; videoKey: string } {
    const rawImageUrl = item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : this.defaultImageUrl;
    const rawVideoUrl = item.videoUrl && item.videoUrl.trim() !== '' ? item.videoUrl : this.defaultVideoUrl;
    const imageKey = rawImageUrl.split('/').pop()?.split('?')[0] || 'propellant_ch4.jpg';
    const videoKey = rawVideoUrl.split('/').pop()?.split('?')[0] || 'video_exhaust_ch4.mp4';
    const videoUrl = rawVideoUrl.includes('?') ? rawVideoUrl : `${rawVideoUrl}?v=2`;

    const molarMass = item.molarMass !== null && item.molarMass !== undefined ? Number(item.molarMass) : item.molarMass;
    const specificHeatRatio = item.specificHeatRatio !== null && item.specificHeatRatio !== undefined ? Number(item.specificHeatRatio) : item.specificHeatRatio;

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

  async getCatalogItems(maxMolarMass?: number): Promise<Array<Propellant & { likesCount: number }>> {
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

  async saveUserDraft(userId: number, dto: SavePropellantDto): Promise<Propellant> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: userId, status: 'draft' },
    });

    if (draft) {
      if (dto.name) draft.name = dto.name;
      if (dto.chemicalFormula !== undefined) draft.chemicalFormula = dto.chemicalFormula;
      if (dto.shortDescription !== undefined) draft.shortDescription = dto.shortDescription;
      if (dto.engineeringAnalysis !== undefined) draft.engineeringAnalysis = dto.engineeringAnalysis;
      if (dto.imageUrl !== undefined) draft.imageUrl = dto.imageUrl;
      if (dto.videoUrl !== undefined) draft.videoUrl = dto.videoUrl;
      if (dto.molarMass !== undefined && !isNaN(dto.molarMass)) draft.molarMass = dto.molarMass;
      if (dto.reactorTemperatureK !== undefined && !isNaN(dto.reactorTemperatureK)) draft.reactorTemperatureK = dto.reactorTemperatureK;
      if (dto.specificHeatRatio !== undefined && !isNaN(dto.specificHeatRatio)) draft.specificHeatRatio = dto.specificHeatRatio;
      if (dto.specificImpulse !== undefined && !isNaN(dto.specificImpulse)) draft.specificImpulse = dto.specificImpulse;
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

  async publishDraft(userId: number, dto: SavePropellantDto): Promise<Propellant> {
    const draft = await this.propellantRepo.findOne({
      where: { creatorId: userId, status: 'draft' },
    });

    if (draft) {
      if (dto.name) draft.name = dto.name;
      if (dto.chemicalFormula !== undefined) draft.chemicalFormula = dto.chemicalFormula;
      if (dto.shortDescription !== undefined) draft.shortDescription = dto.shortDescription;
      if (dto.engineeringAnalysis !== undefined) draft.engineeringAnalysis = dto.engineeringAnalysis;
      if (dto.imageUrl !== undefined) draft.imageUrl = dto.imageUrl;
      if (dto.videoUrl !== undefined) draft.videoUrl = dto.videoUrl;
      if (dto.molarMass !== undefined && !isNaN(dto.molarMass)) draft.molarMass = dto.molarMass;
      if (dto.reactorTemperatureK !== undefined && !isNaN(dto.reactorTemperatureK)) draft.reactorTemperatureK = dto.reactorTemperatureK;
      if (dto.specificHeatRatio !== undefined && !isNaN(dto.specificHeatRatio)) draft.specificHeatRatio = dto.specificHeatRatio;
      if (dto.specificImpulse !== undefined && !isNaN(dto.specificImpulse)) draft.specificImpulse = dto.specificImpulse;
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
}
