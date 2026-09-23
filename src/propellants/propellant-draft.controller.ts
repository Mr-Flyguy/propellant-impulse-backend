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
    @Body('chemical_formula') chemical_formula: string,
    @Body('short_description') short_description: string,
    @Body('molar_mass') molar_mass: string,
    @Body('reactor_temperature_k') reactor_temperature_k: string,
    @Body('specific_heat_ratio') specific_heat_ratio: string,
    @Body('image_url') image_url: string,
    @Body('video_url') video_url: string,
    @Res() res: Response,
  ) {
    await this.propellantsService.saveUserDraft(this.defaultUserId, {
      name: name || 'Новое рабочее тело',
      chemicalFormula: chemical_formula || 'LCH₄',
      shortDescription: short_description || '',
      molarMass: molar_mass ? parseFloat(molar_mass.replace(',', '.')) : 16.04,
      reactorTemperatureK: reactor_temperature_k ? parseInt(reactor_temperature_k, 10) : 2600,
      specificHeatRatio: specific_heat_ratio ? parseFloat(specific_heat_ratio.replace(',', '.')) : 1.32,
      imageUrl: image_url,
      videoUrl: video_url,
    });
    return res.redirect('/propellants/draft');
  }

  @Post('publish')
  async publishDraft(
    @Body('name') name: string,
    @Body('chemical_formula') chemical_formula: string,
    @Body('short_description') short_description: string,
    @Body('molar_mass') molar_mass: string,
    @Body('reactor_temperature_k') reactor_temperature_k: string,
    @Body('specific_heat_ratio') specific_heat_ratio: string,
    @Body('image_url') image_url: string,
    @Body('video_url') video_url: string,
    @Res() res: Response,
  ) {
    await this.propellantsService.publishDraft(this.defaultUserId, {
      name: name || 'Новое рабочее тело',
      chemicalFormula: chemical_formula || 'LCH₄',
      shortDescription: short_description || '',
      molarMass: molar_mass ? parseFloat(molar_mass.replace(',', '.')) : 16.04,
      reactorTemperatureK: reactor_temperature_k ? parseInt(reactor_temperature_k, 10) : 2600,
      specificHeatRatio: specific_heat_ratio ? parseFloat(specific_heat_ratio.replace(',', '.')) : 1.32,
      imageUrl: image_url,
      videoUrl: video_url,
    });
    return res.redirect('/propellants/catalog');
  }
}
