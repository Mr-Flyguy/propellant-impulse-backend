import { Controller, Get, Query, Render } from '@nestjs/common';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantCatalogController {
  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('catalog')
  @Render('propellant-catalog')
  getCatalog(@Query('max_molar_mass') max_molar_mass?: string) {
    const max = max_molar_mass !== undefined && max_molar_mass !== '' ? parseFloat(max_molar_mass) : undefined;
    const items = this.propellantsService.getCatalogItems(max);
    return {
      propellants: items,
      filter_max_molar_mass: max_molar_mass || '20.00',
      active_tab: 'catalog',
    };
  }
}
