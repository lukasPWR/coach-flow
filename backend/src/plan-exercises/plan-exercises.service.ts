import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { PlanExercisesRepository } from "./repositories/plan-exercises.repository";
import { TrainingUnitsRepository } from "../training-units/repositories/training-units.repository";
import { ExercisesRepository } from "../exercises/repositories/exercises.repository";
import { CreatePlanExerciseDto } from "./dto/create-plan-exercise.dto";
import { UpdatePlanExerciseDto } from "./dto/update-plan-exercise.dto";
import { TogglePlanExerciseCompletionDto } from "./dto/toggle-plan-exercise-completion.dto";
import { PlanExerciseResponseDto } from "./dto/plan-exercise-response.dto";

/**
 * Service handling business logic for plan exercises
 */
@Injectable()
export class PlanExercisesService {
  constructor(
    private readonly planExercisesRepository: PlanExercisesRepository,
    private readonly trainingUnitsRepository: TrainingUnitsRepository,
    private readonly exercisesRepository: ExercisesRepository
  ) {}

  /**
   * Adds an exercise to a training unit
   * Only the trainer who owns the plan can add exercises
   * Verifies that the exercise exists and trainer has access to it
   * If sortOrder is not provided, calculates the next order automatically
   *
   * @param unitId - UUID of the training unit
   * @param dto - CreatePlanExerciseDto with exercise details
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise with PlanExerciseResponseDto
   * @throws NotFoundException if unit or exercise doesn't exist or user doesn't have access
   * @throws ForbiddenException if trainer tries to use exercise they don't have access to
   */
  async create(unitId: string, dto: CreatePlanExerciseDto, userId: string): Promise<PlanExerciseResponseDto> {
    // 1. Verify that the training unit exists and fetch it with the training plan
    const trainingUnit = await this.trainingUnitsRepository.findOne({
      where: { id: unitId },
      relations: ["trainingPlan"],
    });

    if (!trainingUnit) {
      throw new NotFoundException(`Training unit with ID ${unitId} not found`);
    }

    // 2. Authorization - Verify that the authenticated user is the owner of the plan
    if (trainingUnit.trainingPlan.trainerId !== userId) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training unit with ID ${unitId} not found`);
    }

    // 3. Verify that the exercise exists
    const exercise = await this.exercisesRepository.findOne({
      where: { id: dto.exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${dto.exerciseId} not found`);
    }

    // 4. Verify that trainer has access to the exercise
    // Trainer can use: system exercises (isSystem = true) OR their own exercises (trainerId = userId)
    const hasAccess = exercise.isSystem || exercise.trainerId === userId;
    if (!hasAccess) {
      // Use 404 to avoid revealing exercise existence
      throw new NotFoundException(`Exercise with ID ${dto.exerciseId} not found`);
    }

    // 5. Calculate sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      sortOrder = await this.planExercisesRepository.getNextSortOrder(unitId);
    }

    // 6. Create new plan exercise entity
    const planExercise = this.planExercisesRepository.create({
      trainingUnitId: unitId,
      exerciseId: dto.exerciseId,
      sets: dto.sets ?? null,
      reps: dto.reps ?? null,
      weight: dto.weight ?? null,
      tempo: dto.tempo ?? null,
      rest: dto.rest ?? null,
      notes: dto.notes ?? null,
      sortOrder,
      isCompleted: false,
    });

    // 7. Save to database
    const savedPlanExercise = await this.planExercisesRepository.save(planExercise);

    // 8. Map to response DTO with exercise name
    return plainToInstance(
      PlanExerciseResponseDto,
      {
        id: savedPlanExercise.id,
        exerciseId: savedPlanExercise.exerciseId,
        exerciseName: exercise.name,
        sets: savedPlanExercise.sets,
        reps: savedPlanExercise.reps,
        weight: savedPlanExercise.weight,
        tempo: savedPlanExercise.tempo,
        rest: savedPlanExercise.rest,
        notes: savedPlanExercise.notes,
        sortOrder: savedPlanExercise.sortOrder,
        isCompleted: savedPlanExercise.isCompleted,
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Updates training parameters of an exercise in a plan
   * Only the trainer who owns the plan can update exercises
   * Cannot change the exerciseId - to change exercise, delete and add new
   *
   * @param id - UUID of the plan exercise entry
   * @param dto - UpdatePlanExerciseDto with fields to update
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise with updated PlanExerciseResponseDto
   * @throws NotFoundException if plan exercise doesn't exist
   * @throws ForbiddenException if trainer doesn't own the plan
   */
  async update(id: string, dto: UpdatePlanExerciseDto, userId: string): Promise<PlanExerciseResponseDto> {
    // 1. Fetch the plan exercise with relations needed for authorization
    const planExercise = await this.planExercisesRepository.findOneWithOwnership({ id });

    if (!planExercise) {
      throw new NotFoundException(`Plan exercise with ID ${id} not found`);
    }

    // 2. Authorization - Verify that the authenticated user owns the plan
    if (planExercise.trainingUnit.trainingPlan.trainerId !== userId) {
      throw new ForbiddenException("You cannot edit this exercise");
    }

    // 3. Update only the provided fields
    if (dto.sets !== undefined) planExercise.sets = dto.sets ?? null;
    if (dto.reps !== undefined) planExercise.reps = dto.reps ?? null;
    if (dto.weight !== undefined) planExercise.weight = dto.weight ?? null;
    if (dto.tempo !== undefined) planExercise.tempo = dto.tempo ?? null;
    if (dto.rest !== undefined) planExercise.rest = dto.rest ?? null;
    if (dto.notes !== undefined) planExercise.notes = dto.notes ?? null;
    if (dto.sortOrder !== undefined) planExercise.sortOrder = dto.sortOrder;

    // 4. Save changes to database
    const updatedPlanExercise = await this.planExercisesRepository.save(planExercise);

    // 5. Map to response DTO with exercise name
    return plainToInstance(
      PlanExerciseResponseDto,
      {
        id: updatedPlanExercise.id,
        exerciseId: updatedPlanExercise.exerciseId,
        exerciseName: planExercise.exercise.name,
        sets: updatedPlanExercise.sets,
        reps: updatedPlanExercise.reps,
        weight: updatedPlanExercise.weight,
        tempo: updatedPlanExercise.tempo,
        rest: updatedPlanExercise.rest,
        notes: updatedPlanExercise.notes,
        sortOrder: updatedPlanExercise.sortOrder,
        isCompleted: updatedPlanExercise.isCompleted,
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Toggles the completion status of an exercise in a plan
   * Only the client who owns the plan can toggle completion status
   * Clients can mark exercises as completed or not completed
   *
   * @param id - UUID of the plan exercise entry
   * @param dto - TogglePlanExerciseCompletionDto with new completion status
   * @param userId - ID of the authenticated user (client)
   * @returns Promise with updated PlanExerciseResponseDto
   * @throws NotFoundException if plan exercise doesn't exist
   * @throws ForbiddenException if user is not the client of the plan
   */
  async toggleCompletion(
    id: string,
    dto: TogglePlanExerciseCompletionDto,
    userId: string
  ): Promise<PlanExerciseResponseDto> {
    // 1. Fetch the plan exercise with relations needed for authorization
    const planExercise = await this.planExercisesRepository.findOneWithOwnership({ id });

    if (!planExercise) {
      throw new NotFoundException(`Plan exercise with ID ${id} not found`);
    }

    // 2. Authorization - Verify that the authenticated user is the client of the plan
    if (planExercise.trainingUnit.trainingPlan.clientId !== userId) {
      throw new ForbiddenException("You cannot access this exercise");
    }

    // 3. Update completion status
    planExercise.isCompleted = dto.isCompleted;

    // 4. Save changes to database
    const updatedPlanExercise = await this.planExercisesRepository.save(planExercise);

    // 5. Map to response DTO with exercise name
    return plainToInstance(
      PlanExerciseResponseDto,
      {
        id: updatedPlanExercise.id,
        exerciseId: updatedPlanExercise.exerciseId,
        exerciseName: planExercise.exercise.name,
        sets: updatedPlanExercise.sets,
        reps: updatedPlanExercise.reps,
        weight: updatedPlanExercise.weight,
        tempo: updatedPlanExercise.tempo,
        rest: updatedPlanExercise.rest,
        notes: updatedPlanExercise.notes,
        sortOrder: updatedPlanExercise.sortOrder,
        isCompleted: updatedPlanExercise.isCompleted,
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Removes an exercise from a training plan
   * Only the trainer who owns the plan can remove exercises
   * Deletes the plan exercise entry, not the exercise definition itself
   *
   * @param id - UUID of the plan exercise entry to remove
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise that resolves when the exercise is removed
   * @throws NotFoundException if plan exercise doesn't exist
   * @throws ForbiddenException if trainer doesn't own the plan
   */
  async remove(id: string, userId: string): Promise<void> {
    // 1. Fetch the plan exercise with relations needed for authorization
    const planExercise = await this.planExercisesRepository.findOneWithOwnership({ id });

    if (!planExercise) {
      throw new NotFoundException(`Plan exercise with ID ${id} not found`);
    }

    // 2. Authorization - Verify that the authenticated user owns the plan
    if (planExercise.trainingUnit.trainingPlan.trainerId !== userId) {
      throw new ForbiddenException("You cannot delete this exercise");
    }

    // 3. Remove the plan exercise from database
    await this.planExercisesRepository.remove(planExercise);
  }
}
