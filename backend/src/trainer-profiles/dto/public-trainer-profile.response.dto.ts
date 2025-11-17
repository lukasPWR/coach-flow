import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Specialization details for public trainer profiles.
 */
export class SpecializationDto {
  @ApiProperty({
    description: "Unique identifier of the specialization",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the specialization",
    example: "Trening siłowy",
  })
  readonly name: string;
}

/**
 * Service details for public trainer profiles.
 */
export class ServiceResponseDto {
  @ApiProperty({
    description: "Unique identifier of the service",
    example: "svc1c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the service (from ServiceType)",
    example: "Trening personalny",
  })
  readonly name: string;

  @ApiProperty({
    description: "Price of the service",
    example: 150.0,
  })
  readonly price: number;

  @ApiProperty({
    description: "Duration of the service in minutes",
    example: 60,
  })
  readonly durationMinutes: number;
}

/**
 * Public trainer profile response DTO with full details.
 * Contains publicly visible information including specializations and services.
 */
export class PublicTrainerProfileResponseDto {
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

  @ApiPropertyOptional({
    description: "City where the trainer operates",
    example: "Warszawa",
  })
  readonly city?: string;

  @ApiPropertyOptional({
    description: "Trainer's profile description",
    example: "Certyfikowany trener personalny z 10-letnim doświadczeniem.",
  })
  readonly description?: string;

  @ApiPropertyOptional({
    description: "URL to the trainer's profile picture",
    example: "https://example.com/profile.jpg",
  })
  readonly profilePictureUrl?: string;

  @ApiProperty({
    description: "List of trainer's specializations",
    type: [SpecializationDto],
  })
  readonly specializations: SpecializationDto[];

  @ApiProperty({
    description: "List of services offered by the trainer",
    type: [ServiceResponseDto],
  })
  readonly services: ServiceResponseDto[];
}
