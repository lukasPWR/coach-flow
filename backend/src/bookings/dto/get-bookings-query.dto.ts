import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BookingStatus } from "../interfaces/booking-status.enum";

/**
 * Enum representing the role perspective for fetching bookings.
 * Used when a user is both a client and a trainer.
 */
export enum UserBookingRole {
  CLIENT = "client",
  TRAINER = "trainer",
}

/**
 * DTO for validating query parameters in GET /bookings endpoint.
 *
 * Provides filtering by status and role, along with pagination support.
 */
export class GetBookingsQueryDto {
  /**
   * Filter bookings by status.
   * @example "PENDING"
   */
  @ApiPropertyOptional({
    enum: BookingStatus,
    description: "Filter bookings by status",
    example: BookingStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  readonly status?: BookingStatus;

  /**
   * Specify the perspective for users who are both client and trainer.
   * @example "client"
   */
  @ApiPropertyOptional({
    enum: UserBookingRole,
    description: "Specify the role perspective (client or trainer)",
    example: UserBookingRole.CLIENT,
  })
  @IsOptional()
  @IsEnum(UserBookingRole)
  readonly role?: UserBookingRole;

  /**
   * Page number for pagination (1-based).
   * @default 1
   */
  @ApiPropertyOptional({
    type: Number,
    description: "Page number for pagination",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  /**
   * Number of items per page.
   * @default 10
   */
  @ApiPropertyOptional({
    type: Number,
    description: "Number of items per page",
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number = 10;
}
