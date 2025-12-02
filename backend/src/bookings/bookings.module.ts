import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Booking } from "./entities/booking.entity";
import { Service } from "../services/entities/service.entity";
import { User } from "../users/entities/user.entity";
import { BookingBan } from "../booking-bans/entities/booking-ban.entity";
import { Unavailability } from "../unavailabilities/entities/unavailability.entity";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { BookingBansModule } from "../booking-bans/booking-bans.module";

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Service, User, BookingBan, Unavailability]), BookingBansModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
