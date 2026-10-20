import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ description: 'Уникальный логин инженера', example: 'engineer_maksim' })
  @IsNotEmpty({ message: 'Логин обязателен' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Электронная почта', example: 'maksim@bmstu.ru' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ description: 'Пароль (минимум 4 символа)', example: 'secret123' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  @MinLength(4, { message: 'Пароль должен содержать не менее 4 символов' })
  password: string;
}
