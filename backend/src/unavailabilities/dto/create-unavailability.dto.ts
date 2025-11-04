import { IsUUID, IsDateString } from 'class-validator';

export class CreateUnavailabilityDto {
  @IsUUID()
  readonly trainerId: string;

  @IsDateString()
  readonly startTime: Date;

  @IsDateString()
  readonly endTime: Date;
}

