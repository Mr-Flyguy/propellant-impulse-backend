import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePropellantDto {
  @ApiProperty({
    description: 'Наименование рабочего тела',
    example: 'Метан (CH4) / Кислород',
  })
  @IsNotEmpty({ message: 'Наименование обязательно' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Краткое описание',
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
