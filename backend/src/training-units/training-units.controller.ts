import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { TrainingUnitsService } from "./training-units.service";
import { TrainingUnitResponseDto } from "../training-plans/dto/training-unit-response.dto";
import { UpdateTrainingUnitDto } from "./dto/update-training-unit.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "../common/interfaces/request-app.interface";

/**
 * Controller handling training units API endpoints
 */
@ApiTags("training-units")
@Controller("training-units")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrainingUnitsController {
  constructor(private readonly trainingUnitsService: TrainingUnitsService) {}

  /**
   * POST /training-units/:id/duplicate
   * Duplicates a training unit with all its exercises
   * Only trainers can duplicate training units
   */
  @Post(":id/duplicate")
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Duplicate a training unit",
    description:
      "Creates a copy of an existing training unit with all its exercises. " +
      "The new unit is added to the same training plan with name 'Kopia - [original name]'. " +
      "All exercise parameters are copied, but completion status is reset. " +
      "Only the trainer who owns the plan can duplicate units.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the training unit to duplicate",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: "Training unit successfully duplicated",
    type: TrainingUnitResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "User is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Training unit not found or user doesn't have access",
  })
  async duplicate(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: IRequestApp
  ): Promise<TrainingUnitResponseDto> {
    return await this.trainingUnitsService.duplicate(id, req.user.userId);
  }

  /**
   * PATCH /training-units/:id
   * Updates a training unit's basic information (name and/or sortOrder)
   * Only trainers can update training units they own
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Update a training unit",
    description:
      "Updates the name and/or sort order of an existing training unit. " +
      "Only the trainer who owns the plan containing the unit can perform this action.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the training unit to update",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Training unit successfully updated",
    type: TrainingUnitResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID format or validation error in request body",
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "User is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Training unit not found or user doesn't have access",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTrainingUnitDto: UpdateTrainingUnitDto,
    @Request() req: IRequestApp
  ): Promise<TrainingUnitResponseDto> {
    return await this.trainingUnitsService.update(id, updateTrainingUnitDto, req.user.userId);
  }

  /**
   * DELETE /training-units/:id
   * Deletes a training unit and all its associated exercises
   * Only trainers can delete training units they own
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Delete a training unit",
    description:
      "Deletes a training unit and all its associated exercises (cascade deletion). " +
      "Only the trainer who owns the plan containing the unit can perform this action.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the training unit to delete",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Training unit successfully deleted",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID format",
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "User is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Training unit not found or user doesn't have access",
  })
  async remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: IRequestApp): Promise<void> {
    return await this.trainingUnitsService.remove(id, req.user.userId);
  }
}
