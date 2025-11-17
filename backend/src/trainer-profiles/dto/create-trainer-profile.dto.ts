import { IsString, IsOptional, IsUrl, IsArray, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a trainer profile.
 * The userId is automatically extracted from the authenticated user's JWT token.
 */
export class CreateTrainerProfileDto {
  @ApiProperty({
    description: "Description of the trainer and their experience",
    example: "Doświadczony trener personalny z 10-letnim stażem.",
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({
    description: "City where the trainer operates",
    example: "Warszawa",
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly city?: string;

  @ApiProperty({
    description: "URL to the trainer's profile picture",
    example: "https://example.com/profile.jpg",
    required: false,
  })
  @IsOptional()
  @IsUrl()
  readonly profilePictureUrl?: string;

  @ApiProperty({
    description: "Array of specialization UUIDs",
    example: ["s1a2b3c4-e5f6-7890-1234-567890abcdef", "s2a2b3c4-e5f6-7890-1234-567890abcdef"],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  readonly specializationIds?: string[];
}
