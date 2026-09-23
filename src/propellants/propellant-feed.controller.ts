import { Controller, Get, Param, Render, NotFoundException } from '@nestjs/common';
import { PropellantsService } from './propellants.service';

@Controller('propellants')
export class PropellantFeedController {
  constructor(private readonly propellantsService: PropellantsService) {}

  @Get('feed')
  @Render('propellant-feed')
  async getFeedRoot() {
    const res = await this.propellantsService.getFeedItem();
    if (!res) {
      throw new NotFoundException('Нет опубликованных рабочих тел');
    }

    return {
      propellant: res.current,
      next_id: res.next_id,
      active_tab: 'feed',
    };
  }

  @Get('feed/:propellant_id')
  @Render('propellant-feed')
  async getFeedById(@Param('propellant_id') propellant_id: string) {
    const id = parseInt(propellant_id, 10);
    const res = await this.propellantsService.getFeedItem(id);

    if (!res || res.current.id !== id) {
      throw new NotFoundException('Рабочее тело не найдено или удалено');
    }

    return {
      propellant: res.current,
      next_id: res.next_id,
      active_tab: 'feed',
    };
  }
}
