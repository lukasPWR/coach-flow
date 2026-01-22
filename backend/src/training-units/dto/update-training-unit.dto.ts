import { PartialType } from "@nestjs/swagger";
import { CreateTrainingUnitDto } from "./create-training-unit.dto";

/**
 * DTO for updating an existing training unit
 */
export class UpdateTrainingUnitDto extends PartialType(CreateTrainingUnitDto) {}
