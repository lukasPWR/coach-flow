import { IsDateString, IsOptional } from 'class-validator';

export class UpdateBookingBanDto {
  @IsOptional()
  @IsDateString()
  readonly bannedUntil?: Date;
}

