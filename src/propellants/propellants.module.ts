import { Module } from '@nestjs/common';
import { PropellantsService } from './propellants.service';
import { PropellantFeedController } from './propellant-feed.controller';
import { PropellantDraftController } from './propellant-draft.controller';
import { PropellantCatalogController } from './propellant-catalog.controller';

@Module({
  controllers: [
    PropellantFeedController,
    PropellantDraftController,
    PropellantCatalogController,
  ],
  providers: [PropellantsService],
  exports: [PropellantsService],
})
export class PropellantsModule {}
