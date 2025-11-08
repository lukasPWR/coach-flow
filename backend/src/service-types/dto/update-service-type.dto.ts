import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class UpdateServiceTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  readonly name?: string;
}
