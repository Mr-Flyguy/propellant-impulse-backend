import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Propellant } from './propellant.entity';

@Entity('propellant_likes')
export class PropellantLike {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'propellant_id' })
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
