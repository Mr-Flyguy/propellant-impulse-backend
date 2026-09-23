import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropellantsService } from './propellants.service';
import { PropellantFeedController } from './propellant-feed.controller';
import { PropellantDraftController } from './propellant-draft.controller';
import { PropellantCatalogController } from './propellant-catalog.controller';
import { User } from './entities/user.entity';
import { Propellant } from './entities/propellant.entity';
import { PropellantLike } from './entities/propellant-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Propellant, PropellantLike])],
  controllers: [
    PropellantFeedController,
    PropellantDraftController,
    PropellantCatalogController,
  ],
  providers: [PropellantsService],
  exports: [PropellantsService],
})
export class PropellantsModule {}
