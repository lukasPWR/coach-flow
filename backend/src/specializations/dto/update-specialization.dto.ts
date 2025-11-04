import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSpecializationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;
}

