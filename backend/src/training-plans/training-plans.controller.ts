import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from "@nestjs/swagger";
import { TrainingPlansService } from "./training-plans.service";
import { TrainingPlanQueryDto } from "./dto/training-plan-query.dto";
import { CreateTrainingPlanDto } from "./dto/create-training-plan.dto";
import { UpdateTrainingPlanDto } from "./dto/update-training-plan.dto";
import { TrainingPlanResponseDto } from "./dto/training-plan-response.dto";
import { TrainingPlanDetailsResponseDto } from "./dto/training-plan-details-response.dto";
import { TrainingUnitResponseDto } from "./dto/training-unit-response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "../common/interfaces/request-app.interface";
import { PlanStatus } from "./interfaces/plan-status.enum";
import { TrainingUnitsService } from "../training-units/training-units.service";
import { CreateTrainingUnitDto } from "../training-units/dto/create-training-unit.dto";

/**
 * Controller handling training plans API endpoints
 */
@ApiTags("training-plans")
@Controller("training-plans")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrainingPlansController {
  constructor(
    private readonly trainingPlansService: TrainingPlansService,
    private readonly trainingUnitsService: TrainingUnitsService
  ) {}

  /**
   * GET /training-plans
   * Retrieves list of training plans with role-based filtering
   * - Trainers: see their own plans, can filter by clientId
   * - Clients: see only plans assigned to them
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get list of training plans",
    description:
      "Returns list of training plans with contextual filtering. " +
      "Trainers see only plans they created (with option to filter by clientId). " +
      "Clients see only plans assigned to them.",
  })
  @ApiQuery({
    name: "clientId",
    required: false,
    description: "Client UUID for filtering plans (trainer only)",
    type: String,
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Plan status for filtering (ACTIVE or ARCHIVED)",
    enum: PlanStatus,
  })
  @ApiResponse({
    status: 200,
    description: "Training plans list retrieved successfully",
    type: [TrainingPlanResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters (e.g. invalid UUID or status)",
  })
  async findAll(
    @Request() request: IRequestApp,
    @Query() query: TrainingPlanQueryDto
  ): Promise<TrainingPlanResponseDto[]> {
    return this.trainingPlansService.findAll(request.user, query);
  }

  /**
   * GET /training-plans/:id
   * Retrieves detailed training plan with nested units and exercises
   * Access is role-based:
   * - Trainers: can access only their own plans (trainerId match)
   * - Clients: can access only plans assigned to them (clientId match)
   */
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get training plan details",
    description:
      "Returns detailed training plan with nested units and exercises. " +
      "Trainers can access only plans they created. " +
      "Clients can access only plans assigned to them.",
  })
  @ApiParam({
    name: "id",
    description: "Training plan UUID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Training plan details retrieved successfully",
    type: TrainingPlanDetailsResponseDto,
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
    status: 404,
    description: "Training plan not found or access denied",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() request: IRequestApp
  ): Promise<TrainingPlanDetailsResponseDto> {
    return this.trainingPlansService.findOne(id, request.user);
  }

  /**
   * POST /training-plans
   * Creates a new training plan for a client
   * Only trainers can create plans
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Create new training plan",
    description:
      "Creates a new training plan for a specified client. " +
      "Only trainers can create plans. " +
      "The plan is created with ACTIVE status and empty structure (units and exercises are added later).",
  })
  @ApiResponse({
    status: 201,
    description: "Training plan created successfully",
    type: TrainingPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request body (validation errors)",
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - user is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Client not found or specified user is not a client",
  })
  async create(
    @Body() createTrainingPlanDto: CreateTrainingPlanDto,
    @Request() request: IRequestApp
  ): Promise<TrainingPlanResponseDto> {
    return this.trainingPlansService.create(createTrainingPlanDto, request.user);
  }

  /**
   * PATCH /training-plans/:id
   * Updates training plan header (name, description, status)
   * Only trainers can update plans, and only their own plans
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Update training plan header",
    description:
      "Updates training plan header information (name, description, status). " +
      "Only trainers can update plans, and only plans they own. " +
      "Structure edits (units and exercises) are done through dedicated endpoints.",
  })
  @ApiParam({
    name: "id",
    description: "Training plan UUID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Training plan updated successfully",
    type: TrainingPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request body or UUID format",
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - user is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Training plan not found or access denied",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTrainingPlanDto: UpdateTrainingPlanDto,
    @Request() request: IRequestApp
  ): Promise<TrainingPlanResponseDto> {
    return this.trainingPlansService.update(id, updateTrainingPlanDto, request.user);
  }

  /**
   * POST /training-plans/:planId/units
   * Creates a new training unit (e.g., "Day A", "Push Day") within a training plan
   * Only trainers can add units, and only to their own plans
   */
  @Post(":planId/units")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Create new training unit",
    description:
      "Creates a new training unit within a training plan. " +
      "Only trainers can create units, and only in plans they own. " +
      "The unit is created empty (exercises are added later). " +
      "If sortOrder is not provided, the unit is added at the end.",
  })
  @ApiParam({
    name: "planId",
    description: "Training plan UUID",
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: "Training unit created successfully",
    type: TrainingUnitResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request body or UUID format",
  })
  @ApiResponse({
    status: 401,
    description: "Missing or invalid JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - user is not a trainer",
  })
  @ApiResponse({
    status: 404,
    description: "Training plan not found or access denied",
  })
  async createUnit(
    @Param("planId", ParseUUIDPipe) planId: string,
    @Body() createTrainingUnitDto: CreateTrainingUnitDto,
    @Request() request: IRequestApp
  ): Promise<TrainingUnitResponseDto> {
    return this.trainingUnitsService.create(planId, createTrainingUnitDto, request.user.userId);
  }
}
