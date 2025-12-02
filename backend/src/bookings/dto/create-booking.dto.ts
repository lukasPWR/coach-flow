import { IsUUID, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a new booking.
 *
 * The clientId is extracted from the JWT token and not provided in the request body.
 * This ensures that users can only create bookings for themselves.
 */
export class CreateBookingDto {
  @ApiProperty({
    description: "The UUID of the trainer to book with",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsUUID()
  readonly trainerId: string;

  @ApiProperty({
    description: "The UUID of the service to book",
    example: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
  })
  @IsUUID()
  readonly serviceId: string;

  @ApiProperty({
    description: "The start time of the booking in ISO 8601 format",
    example: "2023-11-15T14:00:00Z",
  })
  @IsDateString()
  readonly startTime: string;
}
