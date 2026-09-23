import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropellantsModule } from './propellants/propellants.module';

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
    PropellantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
