import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropellantsModule } from './propellants/propellants.module';
import { MinioModule } from './minio/minio.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: 'propellant_user',
      password: 'propellant_pass',
      database: 'propellant_db',
      autoLoadEntities: true,
      synchronize: false,
    }),
    CommonModule,
    MinioModule,
    PropellantsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
