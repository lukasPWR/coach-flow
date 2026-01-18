import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TrainingUnit } from '../../training-units/entities/training-unit.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

@Entity({ name: 'plan_exercises' })
export class PlanExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_unit_id', type: 'uuid' })
  trainingUnitId: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sets: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reps: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  weight: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tempo: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rest: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @ManyToOne(() => TrainingUnit, (trainingUnit) => trainingUnit.planExercises)
  @JoinColumn({ name: 'training_unit_id' })
  trainingUnit: TrainingUnit;

  @ManyToOne(() => Exercise, (exercise) => exercise.planExercises)
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
