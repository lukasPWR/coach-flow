import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for service type data
 *
 * Used to provide a consistent and controlled response format
 * for service type endpoints. Contains only the essential fields
 * that should be exposed to API consumers.
 */
export class ServiceTypeDto {
  @ApiProperty({
    description: "Unikalny identyfikator typu usługi",
    example: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
    format: "uuid",
  })
  id: string;

  @ApiProperty({
    description: "Nazwa typu usługi",
    example: "Trening personalny",
  })
  name: string;
}
