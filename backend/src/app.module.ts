import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
