import { PartialType } from "@nestjs/swagger";
import { CreateUnavailabilityDto } from "./create-unavailability.dto";

/**
 * DTO for updating an existing unavailability period.
 * All fields are optional - only provided fields will be updated.
 * The trainerId cannot be changed and is verified from the JWT token.
 */
export class UpdateUnavailabilityDto extends PartialType(CreateUnavailabilityDto) {}
