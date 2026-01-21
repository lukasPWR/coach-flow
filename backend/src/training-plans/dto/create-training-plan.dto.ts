import { IsString, IsNotEmpty, MaxLength, IsUUID, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO for creating a new training plan
 * Used to validate request body for POST /training-plans
 */
export class CreateTrainingPlanDto {
  @ApiProperty({
    description: "Training plan name",
    example: "Strength Block 1",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: "UUID of client to whom the plan is assigned",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: "Optional training plan description or notes",
    example: "Winter cycle for muscle mass building",
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
