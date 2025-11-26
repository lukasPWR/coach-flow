import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Specialization } from "./entities/specialization.entity";
import { TrainerProfile } from "../trainer-profiles/entities/trainer-profile.entity";
import { SpecializationsController } from "./specializations.controller";
import { SpecializationsService } from "./specializations.service";

@Module({
  imports: [TypeOrmModule.forFeature([Specialization, TrainerProfile])],
  controllers: [SpecializationsController],
  providers: [SpecializationsService],
})
export class SpecializationsModule {}
