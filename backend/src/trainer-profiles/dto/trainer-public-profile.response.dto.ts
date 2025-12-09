import { ApiProperty } from "@nestjs/swagger";
import { SpecializationDto } from "../../specializations/dto/specialization.dto";

// Re-export for convenience
export { SpecializationDto };

/**
 * Public trainer profile response DTO.
 * Contains only publicly visible information about a trainer.
 */
export class TrainerPublicProfileResponseDto {
  @ApiProperty({
    description: "Unique identifier of the trainer (User ID)",
    example: "b1c2d3e4-f5a6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the trainer",
    example: "Anna Nowak",
  })
  readonly name: string;

  @ApiProperty({
    description: "City where the trainer operates",
    example: "Warszawa",
    required: false,
  })
  readonly city?: string;

  @ApiProperty({
    description: "Trainer's profile description",
    example: "Certyfikowany trener personalny z 10-letnim doświadczeniem.",
    required: false,
  })
  readonly description?: string;

  @ApiProperty({
    description: "URL to the trainer's profile picture",
    example: "https://example.com/profile.jpg",
    required: false,
  })
  readonly profilePictureUrl?: string;

  @ApiProperty({
    description: "List of trainer's specializations",
    type: [SpecializationDto],
  })
  readonly specializations: SpecializationDto[];
}
