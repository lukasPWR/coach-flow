import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Unavailability } from "./entities/unavailability.entity";
import { Booking } from "../bookings/entities/booking.entity";
import { UnavailabilitiesController } from "./unavailabilities.controller";
import { UnavailabilitiesService } from "./unavailabilities.service";

/**
 * Module for managing trainer unavailability periods.
 *
 * Imports:
 * - Unavailability entity for managing unavailability records
 * - Booking entity for conflict checking with accepted bookings
 */
@Module({
  imports: [TypeOrmModule.forFeature([Unavailability, Booking])],
  controllers: [UnavailabilitiesController],
  providers: [UnavailabilitiesService],
  exports: [UnavailabilitiesService],
})
export class UnavailabilitiesModule {}
