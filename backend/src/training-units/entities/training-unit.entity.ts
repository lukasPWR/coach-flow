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
import { TrainingPlan } from '../../training-plans/entities/training-plan.entity';
import { PlanExercise } from '../../plan-exercises/entities/plan-exercise.entity';

@Entity({ name: 'training_units' })
export class TrainingUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_plan_id', type: 'uuid' })
  trainingPlanId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;

  @ManyToOne(() => TrainingPlan, (trainingPlan) => trainingPlan.trainingUnits)
  @JoinColumn({ name: 'training_plan_id' })
  trainingPlan: TrainingPlan;

  @OneToMany(() => PlanExercise, (planExercise) => planExercise.trainingUnit)
  planExercises: PlanExercise[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
