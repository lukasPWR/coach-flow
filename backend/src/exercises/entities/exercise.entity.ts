import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PlanExercise } from '../../plan-exercises/entities/plan-exercise.entity';
import { MuscleGroupType } from '../interfaces/muscle-group.enum';

@Entity({ name: 'exercises' })
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trainer_id', type: 'uuid', nullable: true })
  trainerId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'muscle_group',
    type: 'enum',
    enum: MuscleGroupType,
  })
  muscleGroup: MuscleGroupType;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'trainer_id' })
  trainer: User;

  @OneToMany(() => PlanExercise, (planExercise) => planExercise.exercise)
  planExercises: PlanExercise[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
