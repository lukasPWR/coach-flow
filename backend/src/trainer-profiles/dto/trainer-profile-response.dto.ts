import { ApiProperty } from "@nestjs/swagger";
import { SpecializationDto } from "../../specializations/dto/specialization.dto";

// Re-export for convenience
export { SpecializationDto };

/**
 * DTO representing a single service offered by the trainer
 */
export class ServiceDto {
  @ApiProperty({
    description: "Unique identifier of the service",
    example: "d4e5f6a7-b8c9-0123-4567-890abcdef123",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the service type",
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
 * DTO for trainer profile response with related user and specializations data
 */
export class TrainerProfileResponseDto {
  @ApiProperty({
    description: "Unique identifier of the trainer profile",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "User ID associated with this trainer profile",
    example: "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
  })
  readonly userId: string;

  @ApiProperty({
    description: "Name of the trainer (from User entity)",
    example: "Jan Kowalski",
  })
  readonly trainerName: string;

  @ApiProperty({
    description: "Email of the trainer (from User entity)",
    example: "jan.kowalski@example.com",
  })
  readonly email: string;

  @ApiProperty({
    description: "Trainer's profile description",
    example: "Doświadczony trener personalny z 10-letnim stażem.",
    nullable: true,
  })
  readonly description: string | null;

  @ApiProperty({
    description: "City where the trainer operates",
    example: "Warszawa",
    nullable: true,
  })
  readonly city: string | null;

  @ApiProperty({
    description: "URL to the trainer's profile picture",
    example: "https://example.com/profile.jpg",
    nullable: true,
  })
  readonly profilePictureUrl: string | null;

  @ApiProperty({
    description: "List of trainer's specializations",
    type: [SpecializationDto],
  })
  readonly specializations: SpecializationDto[];

  @ApiProperty({
    description: "List of services offered by the trainer",
    type: [ServiceDto],
  })
  readonly services: ServiceDto[];

  @ApiProperty({
    description: "Timestamp when the profile was created",
    example: "2025-11-16T10:00:00.000Z",
  })
  readonly createdAt: Date;
}
