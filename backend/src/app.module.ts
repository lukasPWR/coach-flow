import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TrainerProfilesModule } from "./trainer-profiles/trainer-profiles.module";
import { SpecializationsModule } from "./specializations/specializations.module";
import { ServiceTypesModule } from "./service-types/service-types.module";
import { ServicesModule } from "./services/services.module";
import { BookingsModule } from "./bookings/bookings.module";
import { UnavailabilitiesModule } from "./unavailabilities/unavailabilities.module";
import { BookingBansModule } from "./booking-bans/booking-bans.module";
import { ExercisesModule } from "./exercises/exercises.module";
import { TrainingPlansModule } from "./training-plans/training-plans.module";
import { TrainingUnitsModule } from "./training-units/training-units.module";
import { PlanExercisesModule } from "./plan-exercises/plan-exercises.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../.env", // Use parent directory .env file
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TrainerProfilesModule,
    SpecializationsModule,
    ServiceTypesModule,
    ServicesModule,
    BookingsModule,
    UnavailabilitiesModule,
    BookingBansModule,
    ExercisesModule,
    TrainingPlansModule,
    TrainingUnitsModule,
    PlanExercisesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
