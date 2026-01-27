import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrainerProfile } from "./entities/trainer-profile.entity";
import { User } from "../users/entities/user.entity";
import { Specialization } from "../specializations/entities/specialization.entity";
import { Service } from "../services/entities/service.entity";
import { Unavailability } from "../unavailabilities/entities/unavailability.entity";
import { Booking } from "../bookings/entities/booking.entity";
import { TrainerProfilesController } from "./trainer-profiles.controller";
import { TrainerController } from "./trainer.controller";
import { TrainerProfilesService } from "./trainer-profiles.service";
import { UnavailabilitiesService } from "../unavailabilities/unavailabilities.service";
import { BookingsModule } from "../bookings/bookings.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainerProfile, User, Specialization, Service, Unavailability, Booking]),
    BookingsModule,
  ],
  controllers: [TrainerProfilesController, TrainerController],
  providers: [TrainerProfilesService, UnavailabilitiesService],
})
export class TrainerProfilesModule {}
