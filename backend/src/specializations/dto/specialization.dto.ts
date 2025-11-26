import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for returning specialization data in API responses
 *
 * Used to structure and document the response for specialization endpoints.
 * Ensures only public fields are exposed in the API.
 */
export class SpecializationDto {
  @ApiProperty({
    description: "Unique identifier of the specialization",
    example: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
    format: "uuid",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the specialization",
    example: "Trening siĹ‚owy",
    maxLength: 255,
  })
  readonly name: string;
}
