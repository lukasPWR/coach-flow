import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookingBan } from "./entities/booking-ban.entity";
import { BookingBansService } from "./booking-bans.service";

@Module({
  imports: [TypeOrmModule.forFeature([BookingBan])],
  providers: [BookingBansService],
  exports: [BookingBansService],
})
export class BookingBansModule {}
