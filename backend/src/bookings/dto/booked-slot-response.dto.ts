import { ApiProperty } from "@nestjs/swagger";

export class BookedSlotResponseDto {
  @ApiProperty({
    description: "Start time of the booked slot",
    example: "2025-12-03T10:00:00.000Z",
  })
  readonly startTime: Date;

  @ApiProperty({
    description: "End time of the booked slot",
    example: "2025-12-03T11:00:00.000Z",
  })
  readonly endTime: Date;
}
