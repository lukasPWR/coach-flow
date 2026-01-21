import { IsOptional, IsString, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { MuscleGroupType } from "../interfaces/muscle-group.enum";

export class ExerciseQueryDto {
  @ApiPropertyOptional({
    description: "Search term for filtering exercises by name (partial match)",
    example: "bench press",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter exercises by muscle group",
    enum: MuscleGroupType,
    example: MuscleGroupType.CHEST,
  })
  @IsOptional()
  @IsEnum(MuscleGroupType)
  muscleGroup?: MuscleGroupType;
}
