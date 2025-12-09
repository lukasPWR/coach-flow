import { IsUUID, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBookingBanDto {
  @ApiProperty({
    description: "UUID of the client to ban",
    example: "c1d2e3f4-5678-9012-3456-7890abcdef12",
  })
  @IsUUID()
  readonly clientId: string;

  @ApiProperty({
    description: "UUID of the trainer for whom the ban applies",
    example: "d2e3f4g5-6789-0123-4567-890abcdef123",
  })
  @IsUUID()
  readonly trainerId: string;

  @ApiProperty({
    description: "ISO 8601 date until which the client is banned",
    example: "2026-01-01T00:00:00.000Z",
  })
  @IsDateString()
  readonly bannedUntil: Date;
}
