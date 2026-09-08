import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PropellantsModule } from './propellants/propellants.module';

@Module({
  imports: [PropellantsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
