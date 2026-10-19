import { Controller, Get, Post, Body, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantDraftController {
  private readonly defaultUserId = 1;

  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('draft')
  @Render('propellant-draft')
  async getDraft() {
    const draft = await this.propellantsService.getUserDraft(this.defaultUserId);

    return {
      has_draft: !!draft,
      draft_propellant: draft,
      active_tab: 'draft',
    };
  }

  @Post('draft')
  async saveDraft(
    @Body('name') name: string,
    @Res() res: Response,
  ) {
    await this.propellantsService.saveUserDraft(this.defaultUserId, {
      name: name || 'Новое рабочее тело',
      chemicalFormula: 'LCH₄',
      shortDescription: '',
      molarMass: 16.04,
      reactorTemperatureK: 2600,
      specificHeatRatio: 1.32,
      imageUrl: '/img/invalid_propellant.jpg',
      videoUrl: '/video/invalid_exhaust.mp4',
    });
    return res.redirect('/propellants/draft');
  }

  @Post('publish')
  async publishDraft(
    @Body('name') name: string,
    @Body('short_description') short_description: string,
    @Body('molar_mass') molar_mass: string,
    @Body('specific_heat_ratio') specific_heat_ratio: string,
    @Res() res: Response,
  ) {
    await this.propellantsService.publishDraft(this.defaultUserId, {
      name: name || 'Новое рабочее тело',
      chemicalFormula: 'LCH₄',
      shortDescription: short_description || '',
      molarMass: molar_mass ? parseFloat(molar_mass.replace(',', '.')) : 16.04,
      reactorTemperatureK: 2600,
      specificHeatRatio: specific_heat_ratio ? parseFloat(specific_heat_ratio.replace(',', '.')) : 1.32,
    });
    return res.redirect('/propellants/catalog');
  }
}
