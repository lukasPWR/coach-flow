import { PartialType } from "@nestjs/swagger";
import { CreateServiceDto } from "./create-service.dto";

/**
 * DTO for updating an existing service
 *
 * Uses PartialType to make all fields from CreateServiceDto optional,
 * allowing partial updates (PATCH semantics).
 *
 * All validation rules from CreateServiceDto still apply when fields are provided.
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
