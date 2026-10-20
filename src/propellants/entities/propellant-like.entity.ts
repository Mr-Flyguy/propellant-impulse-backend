import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Propellant } from './propellant.entity';

@Entity('propellant_likes')
@Unique(['userId', 'propellantId'])
export class PropellantLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'propellant_id' })
  propellantId: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Propellant, (propellant) => propellant.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'propellant_id' })
  propellant: Propellant;
}
