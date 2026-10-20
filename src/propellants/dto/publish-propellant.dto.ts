import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PublishPropellantDto {
  @ApiPropertyOptional({
    description: 'Наименование рабочего тела',
    example: 'Метан (CH4) / Кислород',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Краткое описание',
    example: 'Экологичное рабочее тело для ЖРД',
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
