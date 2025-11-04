import { IsUUID, IsNumber, Min, IsInt } from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  readonly trainerId: string;

  @IsUUID()
  readonly serviceTypeId: string;

  @IsNumber()
  @Min(0)
  readonly price: number;

  @IsInt()
  @Min(1)
  readonly durationMinutes: number;
}

