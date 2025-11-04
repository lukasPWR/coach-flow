import { IsString, IsNotEmpty } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;
}

