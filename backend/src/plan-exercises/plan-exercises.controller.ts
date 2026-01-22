import {
  Controller,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from "@nestjs/swagger";
import { PlanExercisesService } from "./plan-exercises.service";
import { UpdatePlanExerciseDto } from "./dto/update-plan-exercise.dto";
import { TogglePlanExerciseCompletionDto } from "./dto/toggle-plan-exercise-completion.dto";
import { PlanExerciseResponseDto } from "./dto/plan-exercise-response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "../common/interfaces/request-app.interface";

/**
 * Controller handling plan exercises API endpoints
 * Allows trainers to manage exercises within training plans
 */
@ApiTags("plan-exercises")
@Controller("plan-exercises")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlanExercisesController {
  constructor(private readonly planExercisesService: PlanExercisesService) {}

  /**
   * PATCH /plan-exercises/:id
   * Updates training parameters of an exercise in a plan
   * Only trainers can update exercises in their plans
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Update plan exercise parameters",
    description:
      "Updates training parameters (sets, reps, weight, tempo, rest, notes, sortOrder) for a specific exercise within a training plan. " +
      "The exerciseId cannot be changed - to change the exercise, delete and add a new one. " +
      "Only the trainer who owns the plan can perform this action.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the plan exercise entry to update",
    type: String,
  })
  @ApiBody({
    type: UpdatePlanExerciseDto,
    description: "Training parameters to update (all fields optional)",
  })
  @ApiResponse({
    status: 200,
    description: "Plan exercise successfully updated",
    type: PlanExerciseResponseDto,
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
    description: "User is not a trainer or doesn't have access to this exercise",
  })
  @ApiResponse({
    status: 404,
    description: "Plan exercise not found",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePlanExerciseDto: UpdatePlanExerciseDto,
    @Request() req: IRequestApp
  ): Promise<PlanExerciseResponseDto> {
    return await this.planExercisesService.update(id, updatePlanExerciseDto, req.user.userId);
  }

  /**
   * PATCH /plan-exercises/:id/completion
   * Toggles the completion status of an exercise in a plan
   * Only clients can toggle completion status of exercises in their plans
   */
  @Patch(":id/completion")
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: "Toggle plan exercise completion status",
    description:
      "Allows clients to mark an exercise as completed or not completed in their training plan. " +
      "Only the client who owns the plan can toggle the completion status. " +
      "This is the only modification operation available to clients.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the plan exercise entry to toggle",
    type: String,
  })
  @ApiBody({
    type: TogglePlanExerciseCompletionDto,
    description: "New completion status",
  })
  @ApiResponse({
    status: 200,
    description: "Completion status successfully toggled",
    type: PlanExerciseResponseDto,
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
    description: "User is not a client or doesn't have access to this exercise",
  })
  @ApiResponse({
    status: 404,
    description: "Plan exercise not found",
  })
  async toggleCompletion(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() toggleDto: TogglePlanExerciseCompletionDto,
    @Request() req: IRequestApp
  ): Promise<PlanExerciseResponseDto> {
    return await this.planExercisesService.toggleCompletion(id, toggleDto, req.user.userId);
  }
}
