import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSpecializationDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}

