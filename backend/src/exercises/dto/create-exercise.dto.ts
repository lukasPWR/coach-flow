import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { MuscleGroupType } from "../interfaces/muscle-group.enum";

export class CreateExerciseDto {
  @ApiProperty({
    description: "Name of the exercise",
    example: "Moje własne ćwiczenie",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: "Target muscle group for the exercise",
    enum: MuscleGroupType,
    example: MuscleGroupType.CHEST,
  })
  @IsEnum(MuscleGroupType)
  @IsNotEmpty()
  muscleGroup: MuscleGroupType;
}
