import { IsUUID, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  readonly clientId: string;

  @IsUUID()
  readonly trainerId: string;

  @IsUUID()
  readonly serviceId: string;

  @IsDateString()
  readonly startTime: Date;
}

