import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ExercisesService } from "./exercises.service";
import { ExerciseQueryDto } from "./dto/exercise-query.dto";
import { ExerciseResponseDto } from "./dto/exercise-response.dto";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GetUser } from "../common/decorators/get-user.decorator";
import type { AuthUserInterface } from "../common/interfaces/auth-user.interface";

@ApiTags("exercises")
@Controller("exercises")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) { }

  @Get()
  @ApiOperation({
    summary: "Get all exercises available to the trainer",
    description:
      "Retrieves a list of exercises including system exercises (available to all) and exercises created by the authenticated trainer. Supports filtering by name and muscle group.",
  })
  @ApiResponse({
    status: 200,
    description: "List of exercises successfully retrieved",
    type: [ExerciseResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid query parameters",
  })
  async findAll(@Query() query: ExerciseQueryDto, @GetUser() user: AuthUserInterface): Promise<ExerciseResponseDto[]> {
    return this.exercisesService.findAll(user.userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new custom exercise",
    description:
      "Creates a new custom exercise in the trainer's library. The exercise is automatically marked as non-system (isSystem: false) and assigned to the authenticated trainer. Only the trainer who created the exercise can see and use it in their training plans.",
  })
  @ApiResponse({
    status: 201,
    description: "Exercise successfully created",
    type: ExerciseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid input data (e.g., invalid muscle group, name too long)",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Database error",
  })
  async create(
    @Body() createExerciseDto: CreateExerciseDto,
    @GetUser() user: AuthUserInterface
  ): Promise<ExerciseResponseDto> {
    return this.exercisesService.create(user.userId, createExerciseDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete (archive) a custom exercise",
    description:
      "Performs a soft delete on a custom exercise by setting the deletedAt timestamp. The exercise will no longer appear in selection lists for new training plans, but remains in the database to preserve historical training plan integrity. System exercises cannot be deleted. Trainers can only delete their own exercises.",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise successfully deleted (archived)",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid UUID format",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot delete system exercises or exercises belonging to other trainers",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Exercise does not exist",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser() user: AuthUserInterface
  ): Promise<{ success: boolean; id: string }> {
    await this.exercisesService.remove(id, user.userId);
    return { success: true, id };
  }
}
