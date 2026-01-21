import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { PlanStatus } from "../interfaces/plan-status.enum";

/**
 * DTO representing training plan in API responses (plan header without nested units)
 */
export class TrainingPlanResponseDto {
  @ApiProperty({
    description: "Training plan UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "UUID of trainer who created the plan",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Expose()
  trainerId: string;

  @ApiProperty({
    description: "UUID of client to whom the plan is assigned",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Expose()
  clientId: string;

  @ApiProperty({
    description: "Training plan name",
    example: "Bulk Plan",
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Training plan description",
    example: "Winter cycle for muscle mass building",
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
    description: "Plan creation date",
    example: "2026-01-20T10:00:00Z",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Last plan update date",
    example: "2026-01-20T10:00:00Z",
  })
  @Expose()
  updatedAt: Date;
}
