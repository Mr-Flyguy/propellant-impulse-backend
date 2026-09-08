import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantFeedController {
  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('feed')
  @Render('propellant-feed')
  getFeedDefault(@Query('next') next?: string) {
    const { current, next_id } = this.propellantsService.getFeedItem(undefined, next === 'true');
    return {
      propellant: current,
      next_propellant_id: next_id,
      active_tab: 'feed',
    };
  }

  @Get('feed/:propellant_id')
  @Render('propellant-feed')
  getFeedById(
    @Param('propellant_id') propellant_id: string,
    @Query('next') next?: string,
  ) {
    const { current, next_id } = this.propellantsService.getFeedItem(propellant_id, next === 'true');
    return {
      propellant: current,
      next_propellant_id: next_id,
      active_tab: 'feed',
    };
  }
}
