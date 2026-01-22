import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainingUnit } from "./entities/training-unit.entity";
import { TrainingUnitsService } from "./training-units.service";
import { TrainingUnitsController } from "./training-units.controller";
import { TrainingUnitsRepository } from "./repositories/training-units.repository";
import { TrainingPlansModule } from "../training-plans/training-plans.module";
import { PlanExercisesModule } from "../plan-exercises/plan-exercises.module";

@Module({
  imports: [TypeOrmModule.forFeature([TrainingUnit]), forwardRef(() => TrainingPlansModule), PlanExercisesModule],
  controllers: [TrainingUnitsController],
  providers: [TrainingUnitsService, TrainingUnitsRepository],
  exports: [TrainingUnitsService, TrainingUnitsRepository],
})
export class TrainingUnitsModule {}
