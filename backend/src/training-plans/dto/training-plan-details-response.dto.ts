import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { PlanStatus } from "../interfaces/plan-status.enum";
import { TrainingUnitResponseDto } from "./training-unit-response.dto";

/**
 * Response DTO for training plan details with nested units and exercises
 * Used for GET /training-plans/:id endpoint
 */
export class TrainingPlanDetailsResponseDto {
  @ApiProperty({
    description: "Training plan UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Trainer UUID",
    example: "123e4567-e89b-12d3-a456-426614174004",
  })
  @Expose()
  trainerId: string;

  @ApiProperty({
    description: "Client UUID",
    example: "123e4567-e89b-12d3-a456-426614174005",
  })
  @Expose()
  clientId: string;

  @ApiProperty({
    description: "Plan name",
    example: "Plan A",
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Plan description",
    example: "Full body training plan for beginners",
    nullable: true,
  })
  @Expose()
  description: string | null;

  @ApiProperty({
    description: "Plan status",
    enum: PlanStatus,
    example: PlanStatus.ACTIVE,
  })
  @Expose()
  status: PlanStatus;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2026-01-20T10:00:00Z",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2026-01-20T10:00:00Z",
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: "List of training units with exercises",
    type: [TrainingUnitResponseDto],
  })
  @Expose()
  @Type(() => TrainingUnitResponseDto)
  units: TrainingUnitResponseDto[];
}
