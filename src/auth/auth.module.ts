import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../propellants/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthApiController } from './auth-api.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthApiController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
