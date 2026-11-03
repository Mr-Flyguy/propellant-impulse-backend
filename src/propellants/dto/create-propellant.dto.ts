import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePropellantDto {
  @ApiProperty({
    description: 'Наименование рабочего тела',
    example: 'Метан жидкий',
  })
  @IsNotEmpty({ message: 'Наименование обязательно' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Описание рабочего тела',
    example: 'Перспективное экологичное ракетное топливо с высокой плотностью',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Краткое описание (алиас для обратной совместимости)',
    example: 'Перспективное экологичное ракетное топливо',
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
