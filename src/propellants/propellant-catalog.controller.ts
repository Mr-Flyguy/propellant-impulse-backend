import { Controller, Get, Post, Param, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantCatalogController {
  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('catalog')
  @Render('propellant-catalog')
  async getCatalog(@Query('max_molar_mass') max_molar_mass?: string) {
    const max = max_molar_mass !== undefined && max_molar_mass !== '' ? parseFloat(max_molar_mass) : undefined;
    const items = await this.propellantsService.getCatalogItems(max);

    return {
      propellants: items,
      filter_max_molar_mass: max_molar_mass || '64.00',
      active_tab: 'catalog',
    };
  }

  @Post('delete/:id')
  async deletePropellant(@Param('id') id: string, @Res() res: Response) {
    await this.propellantsService.deletePropellantRaw(parseInt(id, 10));
    return res.redirect('/propellants/catalog');
  }
}
