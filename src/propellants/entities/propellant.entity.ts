import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { PropellantLike } from './propellant-like.entity';

export type PropellantStatus = 'draft' | 'published' | 'deleted';

@Entity('propellants')
export class Propellant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 32, name: 'chemical_formula', nullable: true })
  chemicalFormula: string;

  @Column({ type: 'varchar', length: 255, name: 'short_description', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', name: 'engineering_analysis', nullable: true })
  engineeringAnalysis: string;

  @Column({ type: 'varchar', length: 32, default: 'draft' })
  status: PropellantStatus;

  @Column({ type: 'varchar', length: 255, name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'video_url', nullable: true })
  videoUrl: string;

  @Column({ type: 'int', name: 'image_size_kb', nullable: true, default: 168 })
  imageSizeKb: number;

  @Column({ type: 'varchar', length: 64, name: 'image_mime', nullable: true, default: 'image/jpeg' })
  imageMime: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 3,
    name: 'molar_mass',
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value !== null && value !== undefined ? Number(value) : value),
    },
  })
  molarMass: number;

  @Column({ type: 'int', name: 'reactor_temperature_k', nullable: true, default: 2400 })
  reactorTemperatureK: number;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'specific_heat_ratio',
    nullable: true,
    default: 1.25,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value !== null && value !== undefined ? Number(value) : value),
    },
  })
  specificHeatRatio: number;

  @Column({ type: 'int', name: 'specific_impulse' })
  specificImpulse: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.propellants, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => PropellantLike, (like) => like.propellant)
  likes: PropellantLike[];
}
