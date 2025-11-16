import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for validating trainer profile ID parameter in URL path.
 */
export class TrainerProfileIdParamDto {
  @ApiProperty({
    description: "Unique identifier of the trainer profile (UUID v4)",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    format: "uuid",
  })
  @IsUUID("4", { message: "ID must be a valid UUID v4" })
  readonly id: string;
}
