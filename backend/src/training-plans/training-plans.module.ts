import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainingPlan } from "./entities/training-plan.entity";
import { TrainingPlansRepository } from "./repositories/training-plans.repository";
import { TrainingPlansService } from "./training-plans.service";
import { TrainingPlansController } from "./training-plans.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([TrainingPlan]), UsersModule],
  controllers: [TrainingPlansController],
  providers: [TrainingPlansRepository, TrainingPlansService],
  exports: [TypeOrmModule, TrainingPlansService],
})
export class TrainingPlansModule {}
