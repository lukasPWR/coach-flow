import { IsDateString, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBookingBanDto {
  @ApiPropertyOptional({
    description: "New ISO 8601 date until which the client is banned",
    example: "2026-02-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  readonly bannedUntil?: Date;
}
