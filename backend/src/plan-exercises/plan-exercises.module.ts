import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlanExercise } from "./entities/plan-exercise.entity";
import { PlanExercisesController } from "./plan-exercises.controller";
import { PlanExercisesService } from "./plan-exercises.service";
import { PlanExercisesRepository } from "./repositories/plan-exercises.repository";
import { TrainingUnitsModule } from "../training-units/training-units.module";
import { ExercisesModule } from "../exercises/exercises.module";

@Module({
  imports: [TypeOrmModule.forFeature([PlanExercise]), forwardRef(() => TrainingUnitsModule), ExercisesModule],
  controllers: [PlanExercisesController],
  providers: [PlanExercisesService, PlanExercisesRepository],
  exports: [PlanExercisesService, PlanExercisesRepository, TypeOrmModule],
})
export class PlanExercisesModule {}
