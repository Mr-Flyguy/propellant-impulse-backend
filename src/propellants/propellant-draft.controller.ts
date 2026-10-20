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
      shortDescription: '',
      molarMass: 16.04,
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
    let parsedMolarMass = molar_mass ? parseFloat(String(molar_mass).replace(',', '.')) : 16.04;
    if (isNaN(parsedMolarMass)) parsedMolarMass = 16.04;

    let parsedGamma = specific_heat_ratio ? parseFloat(String(specific_heat_ratio).replace(',', '.')) : 1.32;
    if (isNaN(parsedGamma)) parsedGamma = 1.32;

    await this.propellantsService.publishDraft(this.defaultUserId, {
      name: name || 'Новое рабочее тело',
      shortDescription: short_description || '',
      molarMass: parsedMolarMass,
      specificHeatRatio: parsedGamma,
    });
    return res.redirect('/propellants/catalog');
  }
}
