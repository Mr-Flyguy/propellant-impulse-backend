import { Injectable } from '@nestjs/common';
import { Propellant, PropellantViewModel } from './propellant.interface';

function makeLikes(count: number): string[] {
  const likes: string[] = [];
  for (let i = 1; i <= count; i++) {
    likes.push(`user_${i}`);
  }
  return likes;
}

@Injectable()
export class PropellantsService {
  private readonly minioBaseUrl = 'http://localhost:9000/propellants';

  private readonly propellants: Propellant[] = [
    {
      propellant_id: '1',
      propellant_name: 'Водород',
      chemical_formula: 'LH₂',
      molar_mass_g_mol: 2.016,
      reactor_temperature_k: 2800,
      specific_heat_ratio: 1.41,
      vacuum_specific_impulse_s: 910,
      thermodynamic_description:
        'Наиболее эффективное рабочее тело для ЯРД благодаря минимальной молекулярной массе. Обеспечивает предельный удельный импульс в реакторах ЯРД.',
      engineering_analysis:
        'При нагреве до 2800 K происходит термодинамическая диссоциация молекул H₂ на атомарный водород. Это снижает эффективную молекулярную массу истекающего газа до 1.8 г/моль и увеличивает скорость истечения газов свыше 8900 м/с.',
      propellant_image_key: 'propellant_h2.jpg',
      propellant_video_key: 'video_exhaust_h2.mp4',
      propellant_image_size_kb: 156,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: makeLikes(42),
    },
    {
      propellant_id: '2',
      propellant_name: 'Метан',
      chemical_formula: 'LCH₄',
      molar_mass_g_mol: 16.04,
      reactor_temperature_k: 2600,
      specific_heat_ratio: 1.32,
      vacuum_specific_impulse_s: 630,
      thermodynamic_description:
        'Высокая плотность хранения и умеренная температура диссоциации. Отличный компромисс между объемом криогенных баков и импульсом.',
      engineering_analysis:
        'Плотность жидкого метана в 6 раз выше водорода (422 кг/м³), что кардинально уменьшает сухую массу баков. При 2600 K диссоциирует на углерод и H₂, обеспечивая оптимальный баланс тяги и габаритов корабля.',
      propellant_image_key: 'propellant_ch4.jpg',
      propellant_video_key: 'video_exhaust_ch4.mp4',
      propellant_image_size_kb: 168,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'draft',
      propellant_user_likes: [],
    },
    {
      propellant_id: '3',
      propellant_name: 'Аммиак',
      chemical_formula: 'LNH₃',
      molar_mass_g_mol: 17.03,
      reactor_temperature_k: 2500,
      specific_heat_ratio: 1.31,
      vacuum_specific_impulse_s: 480,
      thermodynamic_description:
        'Удобен в длительном хранении без криоохлаждения. В реакторе полностью диссоциирует на азот и водород, повышая суммарную газодинамическую тягу.',
      engineering_analysis:
        'Хранится в жидком виде при умеренном давлении. Полная каталитическая диссоциация 2NH₃ → N₂ + 3H₂ снижает эффективную массу смеси до 8.5 г/моль при отсутствии криогенных утечек в межпланетном перелете.',
      propellant_image_key: 'propellant_nh3.jpg',
      propellant_video_key: 'video_exhaust_nh3.mp4',
      propellant_image_size_kb: 145,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'deleted',
      propellant_user_likes: [],
    },
    {
      propellant_id: '4',
      propellant_name: 'Гидразин',
      chemical_formula: 'N₂H₄',
      molar_mass_g_mol: 32.05,
      reactor_temperature_k: 2400,
      specific_heat_ratio: 1.25,
      vacuum_specific_impulse_s: 510,
      thermodynamic_description:
        'Высокоплотное рабочее тело. Эндотермический термический распад в тепловыделяющих сборках обеспечивает высокий массовый секундный расход.',
      engineering_analysis:
        'Двухстадийный распад в ТВЭЛах: первичный термолиз до азота и водорода с последующим нагревом в активной зоне до 2400 K. За счёт плотности 1.02 г/см³ минимизирует лобовое аэродинамическое сопротивление и объем баков.',
      propellant_image_key: 'propellant_n2h4.jpg',
      propellant_video_key: 'video_exhaust_n2h4.mp4',
      propellant_image_size_kb: 172,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: makeLikes(8),
    },
    {
      propellant_id: '5',
      propellant_name: 'Диборан',
      chemical_formula: 'B₂H₆',
      molar_mass_g_mol: 27.67,
      reactor_temperature_k: 2400,
      specific_heat_ratio: 1.18,
      vacuum_specific_impulse_s: 580,
      thermodynamic_description:
        'Диборан обеспечивает хороший баланс между плотностью жидкой фазы и эффективностью реакторного нагрева. Требует карбидного покрытия ТВЭЛов.',
      engineering_analysis:
        'Высокая теплотворность и компактность криобаков. Распад на мелкодисперсный бор и водород требует профилированного сопла Лаваля для предотвращения эрозии стенок и двухфазных потерь импульса.',
      propellant_image_key: 'propellant_b2h6.jpg',
      propellant_video_key: 'video_exhaust_b2h6.mp4',
      propellant_image_size_kb: 142,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: makeLikes(14),
    },
    {
      propellant_id: '6',
      propellant_name: 'Водяной пар',
      chemical_formula: 'H₂O',
      molar_mass_g_mol: 18.01,
      reactor_temperature_k: 2200,
      specific_heat_ratio: 1.33,
      vacuum_specific_impulse_s: 370,
      thermodynamic_description:
        'Безопасное рабочее тело. Отличается высокой доступностью ресурсов в Солнечной системе и простотой конструкции реакторного контура.',
      engineering_analysis:
        'Оптимально для миссий с космической дозаправкой на ледяных астероидах (ISRU). Плотность 1000 кг/м³ упрощает работу турбонасосного агрегата и снижает требования к радиационной защите корабля.',
      propellant_image_key: 'propellant_h2o.jpg',
      propellant_video_key: 'video_exhaust_h2o.mp4',
      propellant_image_size_kb: 130,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: makeLikes(23),
    },
  ];

  private toViewModel(item: Propellant): PropellantViewModel {
    return {
      ...item,
      propellant_image_url: `${this.minioBaseUrl}/${item.propellant_image_key}`,
      propellant_video_url: `${this.minioBaseUrl}/${item.propellant_video_key}?t=${Date.now()}`,
      propellant_likes_count: item.propellant_user_likes.length,
    };
  }

  getPublishedPropellants(): PropellantViewModel[] {
    return this.propellants
      .filter((item) => item.propellant_status === 'published')
      .map((item) => this.toViewModel(item));
  }

  getFeedItem(id?: string, next?: boolean): { current: PropellantViewModel; next_id: string } {
    const list = this.getPublishedPropellants();
    let index = list.findIndex((p) => p.propellant_id === id);
    if (index === -1) {
      index = 0;
    }

    if (next) {
      index = index + 1 >= list.length ? 0 : index + 1;
    }

    const current = list[index];
    const nextIndex = index + 1 >= list.length ? 0 : index + 1;

    return {
      current,
      next_id: list[nextIndex].propellant_id,
    };
  }

  getDraftItem(): PropellantViewModel {
    const draft = this.propellants.find((item) => item.propellant_status === 'draft');
    return this.toViewModel(draft || this.propellants[0]);
  }

  getCatalogItems(max?: number): PropellantViewModel[] {
    const list = this.getPublishedPropellants();
    if (max) {
      return list.filter((item) => item.molar_mass_g_mol <= max);
    }
    return list;
  }
}
