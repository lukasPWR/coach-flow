import { IsDateString, IsOptional } from 'class-validator';

export class UpdateUnavailabilityDto {
  @IsOptional()
  @IsDateString()
  readonly startTime?: Date;

  @IsOptional()
  @IsDateString()
  readonly endTime?: Date;
}

