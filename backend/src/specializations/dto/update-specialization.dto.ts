import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for updating an existing specialization
 *
 * Used to validate incoming data for PATCH /specializations/:id endpoint.
 * The name must be non-empty and at most 255 characters.
 * Only administrators can update specializations.
 */
export class UpdateSpecializationDto {
  @ApiProperty({
    description: "New name for the specialization",
    example: "Trening siłowy",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name: string;
}
