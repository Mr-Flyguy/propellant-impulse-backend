import { IsNotEmpty } from 'class-validator';

export class LikePropellantDto {
  @IsNotEmpty({ message: 'Поле like (1 или 0) обязательно' })
  like: number | boolean | string;
}
