import { IsOptional, IsUUID, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PlanStatus } from "../interfaces/plan-status.enum";

/**
 * DTO for query parameters to filter training plans list
 */
export class TrainingPlanQueryDto {
  @ApiPropertyOptional({
    description: "Client UUID for filtering plans (trainer only)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: "Plan status for filtering",
    enum: PlanStatus,
    example: PlanStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}
