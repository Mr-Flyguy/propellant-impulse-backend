import { ApiProperty } from '@nestjs/swagger';
import { Propellant } from '../entities/propellant.entity';

export class PropellantResponseDto {
  @ApiProperty({ example: 1, description: 'Уникальный идентификатор' })
  id: number;

  @ApiProperty({ example: 'Жидкий водород H₂', description: 'Наименование' })
  name: string;

  @ApiProperty({
    example: 'Эффективное рабочее тело с минимальной массой',
    nullable: true,
    description: 'Краткое описание',
  })
  short_description: string | null;

  @ApiProperty({
    example: 'published',
    enum: ['draft', 'published', 'deleted'],
    description: 'Статус публикации',
  })
  status: string;

  @ApiProperty({
    example: 'http://localhost:9000/propellants/propellant_h2.jpg',
    nullable: true,
    description: 'URL изображения',
  })
  image_url: string | null;

  @ApiProperty({
    example: 'http://localhost:9000/propellants/video_exhaust_h2.mp4',
    nullable: true,
    description: 'URL видео выхлопа',
  })
  video_url: string | null;

  @ApiProperty({
    example: 2.016,
    nullable: true,
    description: 'Молярная масса продуктов сгорания (г/моль)',
  })
  molar_mass: number | null;

  @ApiProperty({
    example: 1.41,
    nullable: true,
    description: 'Показатель адиабаты',
  })
  specific_heat_ratio: number | null;

  @ApiProperty({
    example: 1,
    description: 'ID пользователя-создателя (автозаполняется из сессии)',
  })
  creator_id: number;

  @ApiProperty({ example: 4, description: 'Количество отметок "нравится"' })
  likes_count: number;

  @ApiProperty({
    example: 1,
    description: '1 если текущий пользователь является создателем, иначе 0',
  })
  is_creator: number;

  @ApiProperty({
    example: 0,
    description: '1 если текущий пользователь поставил отметку "нравится", иначе 0',
  })
  is_liked: number;

  static fromEntity(
    entity: Propellant,
    currentUserId?: number,
  ): PropellantResponseDto {
    const isCreator =
      currentUserId !== undefined && currentUserId !== null
        ? entity.creatorId === currentUserId
          ? 1
          : 0
        : 0;
    const isLiked =
      currentUserId !== undefined &&
      currentUserId !== null &&
      entity.likes &&
      entity.likes.some((l) => l.userId === currentUserId)
        ? 1
        : 0;
    const likesCount = entity.likes ? entity.likes.length : 0;

    return {
      id: entity.id,
      name: entity.name,
      short_description: entity.shortDescription ?? null,
      status: entity.status,
      image_url: entity.imageUrl ?? null,
      video_url: entity.videoUrl ?? null,
      molar_mass:
        entity.molarMass !== null && entity.molarMass !== undefined
          ? Number(entity.molarMass)
          : null,
      specific_heat_ratio:
        entity.specificHeatRatio !== null &&
        entity.specificHeatRatio !== undefined
          ? Number(entity.specificHeatRatio)
          : null,
      creator_id: entity.creatorId,
      likes_count: likesCount,
      is_creator: isCreator,
      is_liked: isLiked,
    };
  }
}
