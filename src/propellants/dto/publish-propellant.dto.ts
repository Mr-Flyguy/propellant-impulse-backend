import { IsOptional, IsString } from 'class-validator';

export class PublishPropellantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  molar_mass?: number | string;

  @IsOptional()
  specific_heat_ratio?: number | string;
}
