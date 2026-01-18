import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanExercise } from './entities/plan-exercise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanExercise])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class PlanExercisesModule {}
