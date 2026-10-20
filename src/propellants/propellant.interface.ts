export type PropellantStatus = 'draft' | 'published' | 'deleted';

export interface Propellant {
  propellant_id: string;
  propellant_name: string;
  molar_mass_g_mol: number;
  specific_heat_ratio: number;
  thermodynamic_description: string;
  engineering_analysis: string;
  propellant_image_key: string;
  propellant_video_key: string;
  propellant_status: PropellantStatus;
  propellant_user_likes: string[];
}

export interface PropellantViewModel extends Propellant {
  propellant_image_url: string;
  propellant_video_url: string;
  propellant_likes_count: number;
}
