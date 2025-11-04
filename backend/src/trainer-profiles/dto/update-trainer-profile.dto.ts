import { IsString, IsOptional, IsUrl, IsArray, IsUUID } from 'class-validator';

export class UpdateTrainerProfileDto {
  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsString()
  readonly city?: string;

  @IsOptional()
  @IsUrl()
  readonly profilePictureUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  readonly specializationIds?: string[];
}

