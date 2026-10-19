import { Propellant } from '../entities/propellant.entity';

export class PropellantResponseDto {
  id: number;
  name: string;
  short_description: string | null;
  status: string;
  image_url: string | null;
  video_url: string | null;
  molar_mass: number | null;
  specific_heat_ratio: number | null;
  creator_id: number;
  likes_count: number;
  is_creator: number; // 1 or 0
  is_liked: number; // 1 or 0

  static fromEntity(
    entity: Propellant,
    currentUserId: number,
  ): PropellantResponseDto {
    const isCreator = entity.creatorId === currentUserId ? 1 : 0;
    const isLiked =
      entity.likes && entity.likes.some((l) => l.userId === currentUserId)
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
      molar_mass: entity.molarMass !== null && entity.molarMass !== undefined ? Number(entity.molarMass) : null,
      specific_heat_ratio:
        entity.specificHeatRatio !== null && entity.specificHeatRatio !== undefined
          ? Number(entity.specificHeatRatio)
          : null,
      creator_id: entity.creatorId,
      likes_count: likesCount,
      is_creator: isCreator,
      is_liked: isLiked,
    };
  }
}
