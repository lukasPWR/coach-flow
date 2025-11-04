import { IsUUID, IsString, IsOptional, IsUrl, IsArray } from 'class-validator';

export class CreateTrainerProfileDto {
  @IsUUID()
  readonly userId: string;

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

