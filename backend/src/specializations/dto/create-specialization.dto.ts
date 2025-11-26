import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a new specialization
 *
 * Used to validate incoming data for POST /specializations endpoint.
 * The name must be unique, non-empty, and at most 255 characters.
 */
export class CreateSpecializationDto {
  @ApiProperty({
    description: "Name of the specialization",
    example: "Trening siłowy",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;
}
