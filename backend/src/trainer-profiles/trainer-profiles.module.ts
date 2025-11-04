import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainerProfile } from "./entities/trainer-profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TrainerProfile])],
  controllers: [],
  providers: [],
})
export class TrainerProfilesModule {}
