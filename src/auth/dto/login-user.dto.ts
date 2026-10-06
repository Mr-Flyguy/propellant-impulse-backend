import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: 'Логин обязателен' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString()
  password: string;
}
