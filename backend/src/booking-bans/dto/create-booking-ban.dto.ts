import { IsUUID, IsDateString } from 'class-validator';

export class CreateBookingBanDto {
  @IsUUID()
  readonly clientId: string;

  @IsUUID()
  readonly trainerId: string;

  @IsDateString()
  readonly bannedUntil: Date;
}

