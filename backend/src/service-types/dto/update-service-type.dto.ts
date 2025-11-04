import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateServiceTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;
}

