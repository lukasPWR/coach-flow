import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO representing service type information in service responses
 */
export class ServiceTypeDto {
  @ApiProperty({
    description: "Unique identifier of the service type",
    example: "c0a8f8a0-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    format: "uuid",
  })
  id: string;

  @ApiProperty({
    description: "Name of the service type",
    example: "Trening personalny",
  })
  name: string;
}

/**
 * DTO representing trainer information in service responses
 */
export class TrainerDto {
  @ApiProperty({
    description: "Unique identifier of the trainer",
    example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    format: "uuid",
  })
  id: string;

  @ApiProperty({
    description: "Name of the trainer",
    example: "Jan Kowalski",
  })
  name: string;
}

/**
 * DTO representing a complete service response with all related data
 */
export class ServiceResponseDto {
  @ApiProperty({
    description: "Unique identifier of the service",
    example: "f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    format: "uuid",
  })
  id: string;

  @ApiProperty({
    description: "Price of the service",
    example: 150.0,
    type: "number",
  })
  price: number;

  @ApiProperty({
    description: "Duration of the service in minutes",
    example: 60,
    type: "integer",
  })
  durationMinutes: number;

  @ApiProperty({
    description: "Trainer offering this service",
    type: TrainerDto,
  })
  trainer: TrainerDto;

  @ApiProperty({
    description: "Type of the service",
    type: ServiceTypeDto,
  })
  serviceType: ServiceTypeDto;

  @ApiProperty({
    description: "Timestamp when the service was created",
    example: "2025-11-08T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the service was last updated",
    example: "2025-11-08T10:00:00.000Z",
  })
  updatedAt: Date;
}
