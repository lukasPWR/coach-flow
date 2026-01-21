import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { TrainingPlansRepository } from "./repositories/training-plans.repository";
import { TrainingPlanQueryDto } from "./dto/training-plan-query.dto";
import { TrainingPlanResponseDto } from "./dto/training-plan-response.dto";
import { TrainingPlanDetailsResponseDto } from "./dto/training-plan-details-response.dto";
import { CreateTrainingPlanDto } from "./dto/create-training-plan.dto";
import { UpdateTrainingPlanDto } from "./dto/update-training-plan.dto";
import { TrainingPlanFilters } from "./interfaces/training-plan-filters.interface";
import { AuthUserInterface } from "../common/interfaces/auth-user.interface";
import { UserRole } from "../users/interfaces/user-role.enum";
import { UsersService } from "../users/users.service";
import { PlanStatus } from "./interfaces/plan-status.enum";

/**
 * Service handling business logic for training plans
 */
@Injectable()
export class TrainingPlansService {
  constructor(
    private readonly trainingPlansRepository: TrainingPlansRepository,
    private readonly usersService: UsersService
  ) {}

  /**
   * Retrieves list of training plans with role-based filtering
   * - Trainers see only their own plans (with option to filter by clientId)
   * - Clients see only plans assigned to them
   *
   * @param user - Authenticated user from JWT token
   * @param query - Query parameters (clientId, status)
   * @returns Promise with array of TrainingPlanResponseDto
   */
  async findAll(user: AuthUserInterface, query: TrainingPlanQueryDto): Promise<TrainingPlanResponseDto[]> {
    // Build filters based on user role
    const filters: TrainingPlanFilters = {};

    if (user.role === UserRole.TRAINER) {
      // Trainer sees only their own plans
      filters.trainerId = user.userId;

      // Optionally can filter by clientId
      if (query.clientId) {
        filters.clientId = query.clientId;
      }
    } else if (user.role === UserRole.CLIENT) {
      // Client sees only plans assigned to them
      // Ignore query.clientId for security
      filters.clientId = user.userId;
    }

    // Copy status filter if provided
    if (query.status) {
      filters.status = query.status;
    }

    // Fetch plans from repository
    const plans = await this.trainingPlansRepository.findAll(filters);

    // Map entities to response DTOs
    return plans.map((plan) =>
      plainToInstance(TrainingPlanResponseDto, plan, {
        excludeExtraneousValues: true,
      })
    );
  }

  /**
   * Retrieves detailed training plan with nested units and exercises
   * Enforces access control based on user role:
   * - Trainers can access only their own plans (trainerId match)
   * - Clients can access only plans assigned to them (clientId match)
   *
   * @param id - Training plan UUID
   * @param user - Authenticated user from JWT token
   * @returns Promise with TrainingPlanDetailsResponseDto
   * @throws NotFoundException if plan doesn't exist or user has no access
   */
  async findOne(id: string, user: AuthUserInterface): Promise<TrainingPlanDetailsResponseDto> {
    // Fetch plan with all relations
    const plan = await this.trainingPlansRepository.findOneWithDetails(id);

    // Check if plan exists
    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }

    // Verify access rights based on user role
    const hasAccess =
      (user.role === UserRole.TRAINER && plan.trainerId === user.userId) ||
      (user.role === UserRole.CLIENT && plan.clientId === user.userId);

    if (!hasAccess) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }

    // Map entity to response DTO with nested structures
    // Need to manually map trainingUnits to units and planExercises to exercises
    const mappedPlan = {
      ...plan,
      units:
        plan.trainingUnits?.map((unit) => ({
          id: unit.id,
          name: unit.name,
          sortOrder: unit.sortOrder,
          exercises:
            unit.planExercises?.map((planExercise) => ({
              id: planExercise.id,
              exerciseId: planExercise.exerciseId,
              exerciseName: planExercise.exercise?.name || "Unknown Exercise",
              sets: planExercise.sets,
              reps: planExercise.reps,
              weight: planExercise.weight,
              tempo: planExercise.tempo,
              rest: planExercise.rest,
              notes: planExercise.notes,
              sortOrder: planExercise.sortOrder,
              isCompleted: planExercise.isCompleted,
            })) || [],
        })) || [],
    };

    return plainToInstance(TrainingPlanDetailsResponseDto, mappedPlan, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Creates a new training plan
   * Only trainers can create plans for their clients
   * Validates that the client exists and has CLIENT role
   *
   * @param createTrainingPlanDto - DTO containing plan details
   * @param user - Authenticated trainer from JWT token
   * @returns Promise with TrainingPlanResponseDto
   * @throws NotFoundException if client doesn't exist or doesn't have CLIENT role
   */
  async create(
    createTrainingPlanDto: CreateTrainingPlanDto,
    user: AuthUserInterface
  ): Promise<TrainingPlanResponseDto> {
    // Validate that client exists and has CLIENT role
    const client = await this.usersService.findOne(createTrainingPlanDto.clientId);

    if (client.role !== UserRole.CLIENT) {
      throw new NotFoundException(`User with ID ${createTrainingPlanDto.clientId} is not a client`);
    }

    // Create new training plan entity
    const trainingPlan = this.trainingPlansRepository.create({
      trainerId: user.userId,
      clientId: createTrainingPlanDto.clientId,
      name: createTrainingPlanDto.name,
      description: createTrainingPlanDto.description || null,
      status: PlanStatus.ACTIVE,
    });

    // Save to database
    const savedPlan = await this.trainingPlansRepository.save(trainingPlan);

    // Map entity to response DTO
    return plainToInstance(TrainingPlanResponseDto, savedPlan, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Updates training plan header
   * Only trainers can update plans, and only their own plans
   * Verifies ownership before allowing updates
   *
   * @param id - Training plan UUID
   * @param updateTrainingPlanDto - DTO containing fields to update
   * @param user - Authenticated trainer from JWT token
   * @returns Promise with updated TrainingPlanResponseDto
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if user is not the plan owner (or NotFoundException for security)
   */
  async update(
    id: string,
    updateTrainingPlanDto: UpdateTrainingPlanDto,
    user: AuthUserInterface
  ): Promise<TrainingPlanResponseDto> {
    // Fetch the plan from database
    const plan = await this.trainingPlansRepository.findOne({
      where: { id },
    });

    // Check if plan exists
    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }

    // Verify ownership: only plan owner (trainer) can update
    if (plan.trainerId !== user.userId) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }

    // Apply updates from DTO to entity
    if (updateTrainingPlanDto.name !== undefined) {
      plan.name = updateTrainingPlanDto.name;
    }

    if (updateTrainingPlanDto.description !== undefined) {
      plan.description = updateTrainingPlanDto.description;
    }

    if (updateTrainingPlanDto.status !== undefined) {
      plan.status = updateTrainingPlanDto.status;
    }

    // Save changes to database
    const updatedPlan = await this.trainingPlansRepository.save(plan);

    // Map entity to response DTO
    return plainToInstance(TrainingPlanResponseDto, updatedPlan, {
      excludeExtraneousValues: true,
    });
  }
}
