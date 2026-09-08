export type PropellantStatus = 'draft' | 'published' | 'deleted';

export interface Propellant {
  propellant_id: string;
  propellant_name: string;
  chemical_formula: string;
  molar_mass_g_mol: number;
  reactor_temperature_k: number;
  specific_heat_ratio: number;
  vacuum_specific_impulse_s: number;
  thermodynamic_description: string;
  engineering_analysis: string;
  propellant_image_key: string;
  propellant_video_key: string;
  propellant_image_size_kb: number;
  propellant_image_mime: string;
  propellant_status: PropellantStatus;
  propellant_user_likes: string[];
}

export interface PropellantViewModel extends Propellant {
  propellant_image_url: string;
  propellant_video_url: string;
  propellant_likes_count: number;
}
