import { IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a new unavailability period.
 * The trainerId is automatically extracted from the JWT token,
 * so it should not be included in the request body.
 */
export class CreateUnavailabilityDto {
  @ApiProperty({
    description: "Start time of the unavailability period (ISO8601 format)",
    example: "2023-12-24T09:00:00.000Z",
    type: String,
  })
  @IsDateString()
  readonly startTime: string;

  @ApiProperty({
    description: "End time of the unavailability period (ISO8601 format)",
    example: "2023-12-26T17:00:00.000Z",
    type: String,
  })
  @IsDateString()
  readonly endTime: string;
}
