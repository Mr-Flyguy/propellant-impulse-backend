import { Controller, Get, Render } from '@nestjs/common';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantDraftController {
  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('draft')
  @Render('propellant-draft')
  getDraft() {
    return {
      draft_propellant: this.propellantsService.getDraftItem(),
      active_tab: 'draft',
    };
  }
}
