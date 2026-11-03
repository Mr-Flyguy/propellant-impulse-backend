import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PublishPropellantDto {
  @ApiPropertyOptional({
    description: 'Наименование рабочего тела',
    example: 'Метан жидкий',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Описание рабочего тела',
    example: 'Экологичное рабочее тело для двигательной установки',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Краткое описание (алиас для обратной совместимости)',
    example: 'Экологичное рабочее тело для двигательной установки',
  })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiPropertyOptional({
    description: 'Молярная масса продуктов сгорания (г/моль)',
    example: 16.04,
  })
  @IsOptional()
  molar_mass?: number | string;

  @ApiPropertyOptional({
    description: 'Показатель адиабаты (отношение теплоемкостей)',
    example: 1.32,
  })
  @IsOptional()
  specific_heat_ratio?: number | string;
}
