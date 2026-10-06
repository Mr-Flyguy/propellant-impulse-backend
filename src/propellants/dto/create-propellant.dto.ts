import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePropellantDto {
  @IsNotEmpty({ message: 'Наименование обязательно' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  molar_mass?: number | string;

  @IsOptional()
  specific_heat_ratio?: number | string;
}
