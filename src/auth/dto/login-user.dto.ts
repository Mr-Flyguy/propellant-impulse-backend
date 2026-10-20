import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ description: 'Логин инженера', example: 'test_engineer' })
  @IsNotEmpty({ message: 'Логин обязателен' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Пароль', example: 'secret123' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  password: string;
}
