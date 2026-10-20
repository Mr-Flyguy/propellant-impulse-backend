import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePropellantDto {
  @ApiPropertyOptional({
    description: 'Наименование рабочего тела',
    example: 'Жидкий метан CH₄ (модифицированный)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Краткое описание рабочего тела',
    example: 'Модифицированное описание рабочего тела',
  })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiPropertyOptional({
    description: 'Молярная масса продуктов истечения (г/моль)',
    example: 16.5,
  })
  @IsOptional()
  molar_mass?: number | string;

  @ApiPropertyOptional({
    description: 'Показатель адиабаты (отношение теплоемкостей)',
    example: 1.3,
  })
  @IsOptional()
  specific_heat_ratio?: number | string;

  @ApiPropertyOptional({
    description: 'Статус публикации',
    example: 'published',
    enum: ['draft', 'published', 'deleted'],
  })
  @IsOptional()
  @IsString()
  status?: 'draft' | 'published' | 'deleted';
}
