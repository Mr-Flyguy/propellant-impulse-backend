import { Injectable } from '@nestjs/common';
import { Propellant, PropellantViewModel } from './propellant.interface';

@Injectable()
export class PropellantsService {
  private readonly minioBaseUrl = 'http://localhost:9000/propellants';

  private readonly propellants: Propellant[] = [
    {
      propellant_id: '1',
      propellant_name: 'Жидкий водород',
      chemical_formula: 'LH₂',
      molar_mass_g_mol: 2.016,
      reactor_temperature_k: 2800,
      specific_heat_ratio: 1.41,
      vacuum_specific_impulse_s: 910,
      thermodynamic_description:
        'Эффективное рабочее тело за счёт минимальной массы и предельного импульса.',
      engineering_analysis:
        'Термолиз при 2800 K снижает массу газа до 1.8 г/моль, разгоняя истечение свыше 8900 м/с.',
      propellant_image_key: 'propellant_h2.jpg',
      propellant_video_key: 'video_exhaust_h2.mp4',
      propellant_image_size_kb: 156,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08', 'usr_09', 'usr_10',
        'usr_11', 'usr_12', 'usr_13', 'usr_14', 'usr_15', 'usr_16', 'usr_17', 'usr_18', 'usr_19', 'usr_20',
        'usr_21', 'usr_22', 'usr_23', 'usr_24', 'usr_25', 'usr_26', 'usr_27', 'usr_28', 'usr_29', 'usr_30',
        'usr_31', 'usr_32', 'usr_33', 'usr_34', 'usr_35', 'usr_36', 'usr_37', 'usr_38', 'usr_39', 'usr_40',
        'usr_41', 'usr_42'
      ],
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
        'Плотное криогенное топливо с балансом между объемом баков и тягой двигателя.',
      engineering_analysis:
        'Плотность 422 кг/м³ кардинально снижает массу баков при оптимальном балансе тяги и импульса.',
      propellant_image_key: 'propellant_ch4.jpg',
      propellant_video_key: 'video_exhaust_ch4.mp4',
      propellant_image_size_kb: 168,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08', 'usr_09', 'usr_10',
        'usr_11', 'usr_12', 'usr_13', 'usr_14', 'usr_15', 'usr_16', 'usr_17', 'usr_18', 'usr_19'
      ],
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
        'Удобен для длительного хранения без криоохлаждения и диссоциирует в реакторе.',
      engineering_analysis:
        'Каталитический распад 2NH₃ → N₂ + 3H₂ дает смесь с массой 8.5 г/моль без криогенных утечек.',
      propellant_image_key: 'propellant_nh3.jpg',
      propellant_video_key: 'video_exhaust_nh3.mp4',
      propellant_image_size_kb: 145,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08', 'usr_09', 'usr_10',
        'usr_11', 'usr_12', 'usr_13', 'usr_14', 'usr_15', 'usr_16', 'usr_17', 'usr_18', 'usr_19', 'usr_20',
        'usr_21', 'usr_22', 'usr_23', 'usr_24', 'usr_25', 'usr_26', 'usr_27', 'usr_28', 'usr_29', 'usr_30',
        'usr_31'
      ],
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
        'Высокоплотное рабочее тело, дающее высокий расход при распаде в реакторе.',
      engineering_analysis:
        'Плотность 1.02 г/см³ минимизирует объем баков и лобовое сопротивление корабля.',
      propellant_image_key: 'propellant_n2h4.jpg',
      propellant_video_key: 'video_exhaust_n2h4.mp4',
      propellant_image_size_kb: 172,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'published',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08'
      ],
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
        'Обеспечивает компактность криобаков и высокий энерговыход при нагреве.',
      engineering_analysis:
        'Высокая теплотворность и компактность баков при реакторном распаде на бор и водород.',
      propellant_image_key: 'propellant_b2h6.jpg',
      propellant_video_key: 'video_exhaust_b2h6.mp4',
      propellant_image_size_kb: 142,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'draft',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08', 'usr_09', 'usr_10',
        'usr_11', 'usr_12', 'usr_13', 'usr_14'
      ],
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
        'Безопасное рабочее тело с высокой доступностью ресурсов для дозаправки.',
      engineering_analysis:
        'Оптимально для заправки на ледяных астероидах (ISRU) без криогенных утечек.',
      propellant_image_key: 'propellant_h2o.jpg',
      propellant_video_key: 'video_exhaust_h2o.mp4',
      propellant_image_size_kb: 130,
      propellant_image_mime: 'image/jpeg',
      propellant_status: 'deleted',
      propellant_user_likes: [
        'usr_01', 'usr_02', 'usr_03', 'usr_04', 'usr_05', 'usr_06', 'usr_07', 'usr_08', 'usr_09', 'usr_10',
        'usr_11', 'usr_12', 'usr_13', 'usr_14', 'usr_15', 'usr_16', 'usr_17', 'usr_18', 'usr_19', 'usr_20',
        'usr_21', 'usr_22', 'usr_23'
      ],
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
    if (max !== undefined && !isNaN(max)) {
      return list.filter((item) => item.molar_mass_g_mol <= max);
    }
    return list;
  }
}
