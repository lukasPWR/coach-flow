import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainingPlan } from "./entities/training-plan.entity";
import { TrainingPlansRepository } from "./repositories/training-plans.repository";
import { TrainingPlansService } from "./training-plans.service";
import { TrainingPlansController } from "./training-plans.controller";
import { UsersModule } from "../users/users.module";
import { TrainingUnitsModule } from "../training-units/training-units.module";

@Module({
  imports: [TypeOrmModule.forFeature([TrainingPlan]), UsersModule, forwardRef(() => TrainingUnitsModule)],
  controllers: [TrainingPlansController],
  providers: [TrainingPlansRepository, TrainingPlansService],
  exports: [TypeOrmModule, TrainingPlansService, TrainingPlansRepository],
})
export class TrainingPlansModule {}
