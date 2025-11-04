import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { BookingStatus } from "../interfaces/booking-status.enum";

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  readonly startTime?: Date;

  @IsOptional()
  @IsEnum(BookingStatus)
  readonly status?: BookingStatus;
}
