import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePropellantDto {
  @IsNotEmpty({ message: 'Наименование обязательно' })
  @IsString()
  name: string;
}
