import { ApiProperty } from "@nestjs/swagger";
import { BasicUserResponseDto } from "../../users/dto/basic-user-response.dto";

/**
 * Response DTO for booking ban details.
 *
 * Contains complete booking ban information with nested client and trainer data.
 */
export class BookingBanResponseDto {
  @ApiProperty({
    description: "Unique identifier of the booking ban",
    example: "c1d2e3f4-g5h6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Date until which the client is banned from booking with the trainer",
    example: "2024-01-01T00:00:00.000Z",
    type: Date,
  })
  readonly bannedUntil: Date;

  @ApiProperty({
    description: "Client who is banned",
    type: BasicUserResponseDto,
  })
  readonly client: BasicUserResponseDto;

  @ApiProperty({
    description: "Trainer from whom the client is banned",
    type: BasicUserResponseDto,
  })
  readonly trainer: BasicUserResponseDto;

  @ApiProperty({
    description: "Date when the booking ban was created",
    example: "2023-12-01T10:00:00.000Z",
    type: Date,
  })
  readonly createdAt: Date;
}
