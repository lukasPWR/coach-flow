import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for unavailability entity.
 * Used when returning unavailability data to the client.
 */
export class UnavailabilityResponseDto {
  @ApiProperty({
    description: "Unique identifier of the unavailability period",
    example: "abc-123-uuid",
  })
  readonly id: string;

  @ApiProperty({
    description: "Start time of the unavailability period",
    example: "2023-12-24T09:00:00.000Z",
    type: Date,
  })
  readonly startTime: Date;

  @ApiProperty({
    description: "End time of the unavailability period",
    example: "2023-12-26T17:00:00.000Z",
    type: Date,
  })
  readonly endTime: Date;

  @ApiProperty({
    description: "UUID of the trainer",
    example: "trainer-uuid",
  })
  readonly trainerId: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2023-12-20T10:00:00.000Z",
    type: Date,
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2023-12-20T10:00:00.000Z",
    type: Date,
  })
  readonly updatedAt: Date;

  constructor(partial: Partial<UnavailabilityResponseDto>) {
    Object.assign(this, partial);
  }
}
