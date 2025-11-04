import { IsNumber, Min, IsInt, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly durationMinutes?: number;
}

