import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainerProfile } from "./entities/trainer-profile.entity";
import { User } from "../users/entities/user.entity";
import { Specialization } from "../specializations/entities/specialization.entity";
import { Service } from "../services/entities/service.entity";
import { TrainerProfilesController } from "./trainer-profiles.controller";
import { TrainerProfilesService } from "./trainer-profiles.service";

@Module({
  imports: [TypeOrmModule.forFeature([TrainerProfile, User, Specialization, Service])],
  controllers: [TrainerProfilesController],
  providers: [TrainerProfilesService],
})
export class TrainerProfilesModule {}
