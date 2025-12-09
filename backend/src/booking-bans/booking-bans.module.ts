import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { BookingBan } from "./entities/booking-ban.entity";
import { BookingBansService } from "./booking-bans.service";
import { BookingBansController } from "./booking-bans.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BookingBan, User])],
  providers: [BookingBansService],
  controllers: [BookingBansController],
  exports: [BookingBansService],
})
export class BookingBansModule {}
