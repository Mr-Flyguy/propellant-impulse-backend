import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Propellant } from './propellant.entity';
import { PropellantLike } from './propellant-like.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  email: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Propellant, (propellant) => propellant.creator)
  propellants: Propellant[];

  @OneToMany(() => PropellantLike, (like) => like.user)
  likes: PropellantLike[];
}
