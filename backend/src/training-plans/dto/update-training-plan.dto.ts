import { IsString, MaxLength, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PlanStatus } from "../interfaces/plan-status.enum";

/**
 * DTO for updating training plan header
 * Used to validate request body for PATCH /training-plans/:id
 * All fields are optional
 */
export class UpdateTrainingPlanDto {
  @ApiProperty({
    description: "Updated training plan name",
    example: "Advanced Strength Program",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: "Updated training plan description or notes",
    example: "Modified plan for advanced athletes",
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: "Updated plan status (ACTIVE or ARCHIVED)",
    example: PlanStatus.ACTIVE,
    enum: PlanStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}
