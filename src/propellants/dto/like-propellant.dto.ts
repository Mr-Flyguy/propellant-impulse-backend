import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LikePropellantDto {
  @ApiProperty({
    description: 'Отметка "нравится" (1 или true - поставить, 0 или false - снять)',
    example: 1,
  })
  @IsNotEmpty({ message: 'Поле like (1 или 0) обязательно' })
  like: number | boolean | string;
}
