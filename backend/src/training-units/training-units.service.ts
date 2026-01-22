import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { DataSource } from "typeorm";
import { TrainingUnitsRepository } from "./repositories/training-units.repository";
import { TrainingPlansRepository } from "../training-plans/repositories/training-plans.repository";
import { CreateTrainingUnitDto } from "./dto/create-training-unit.dto";
import { UpdateTrainingUnitDto } from "./dto/update-training-unit.dto";
import { TrainingUnitResponseDto } from "../training-plans/dto/training-unit-response.dto";
import { TrainingUnit } from "./entities/training-unit.entity";

/**
 * Service handling business logic for training units
 */
@Injectable()
export class TrainingUnitsService {
  constructor(
    private readonly trainingUnitsRepository: TrainingUnitsRepository,
    private readonly trainingPlansRepository: TrainingPlansRepository,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Creates a new training unit within a training plan
   * Only the trainer who owns the plan can add units
   * If sortOrder is not provided, calculates the next order automatically
   *
   * @param planId - UUID of the training plan
   * @param dto - CreateTrainingUnitDto with unit details
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise with TrainingUnitResponseDto
   * @throws NotFoundException if plan doesn't exist or user doesn't have access
   */
  async create(planId: string, dto: CreateTrainingUnitDto, userId: string): Promise<TrainingUnitResponseDto> {
    // Verify that the plan exists
    const plan = await this.trainingPlansRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${planId} not found`);
    }

    // Verify that the authenticated user is the owner of the plan
    if (plan.trainerId !== userId) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training plan with ID ${planId} not found`);
    }

    // Calculate sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      sortOrder = await this.trainingUnitsRepository.getNextSortOrder(planId);
    }

    // Create new training unit entity
    const trainingUnit = this.trainingUnitsRepository.create({
      trainingPlanId: planId,
      name: dto.name,
      sortOrder,
    });

    // Save to database
    const savedUnit = await this.trainingUnitsRepository.save(trainingUnit);

    // Map to response DTO
    // For newly created units, exercises array is empty
    return plainToInstance(
      TrainingUnitResponseDto,
      {
        ...savedUnit,
        exercises: [],
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Duplicates a training unit with all its exercises
   * Creates a copy of the unit with name "Kopia - [original name]"
   * Copies all exercises with their parameters
   * Only the trainer who owns the plan can duplicate units
   *
   * @param unitId - UUID of the training unit to duplicate
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise with TrainingUnitResponseDto of the new unit
   * @throws NotFoundException if unit doesn't exist or user doesn't have access
   */
  async duplicate(unitId: string, userId: string): Promise<TrainingUnitResponseDto> {
    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      // Get source unit with exercises and plan
      const sourceUnit = await this.trainingUnitsRepository.findOne({
        where: { id: unitId },
        relations: ["planExercises", "trainingPlan"],
      });

      if (!sourceUnit) {
        throw new NotFoundException(`Training unit with ID ${unitId} not found`);
      }

      // Verify ownership - check if user is the trainer of the plan
      if (sourceUnit.trainingPlan.trainerId !== userId) {
        // Return 404 instead of 403 to avoid revealing resource existence
        throw new NotFoundException(`Training unit with ID ${unitId} not found`);
      }

      // Calculate next sort order for the new unit
      const nextSortOrder = await this.trainingUnitsRepository.getNextSortOrder(sourceUnit.trainingPlanId);

      // Create new unit with copied name
      const newUnit = manager.create(TrainingUnit, {
        trainingPlanId: sourceUnit.trainingPlanId,
        name: `Kopia - ${sourceUnit.name}`,
        sortOrder: nextSortOrder,
      });

      // Save new unit
      const savedUnit = await manager.save(TrainingUnit, newUnit);

      // Duplicate all exercises from source unit
      const newExercises = sourceUnit.planExercises.map((exercise, index) => {
        return manager.create("PlanExercise", {
          trainingUnitId: savedUnit.id,
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          tempo: exercise.tempo,
          rest: exercise.rest,
          notes: exercise.notes,
          sortOrder: exercise.sortOrder,
          isCompleted: false, // Reset completion status for duplicated exercises
        });
      });

      // Save all duplicated exercises in bulk
      const savedExercises = newExercises.length > 0 ? await manager.save("PlanExercise", newExercises) : [];

      // Map to response DTO with exercises
      return plainToInstance(
        TrainingUnitResponseDto,
        {
          id: savedUnit.id,
          name: savedUnit.name,
          sortOrder: savedUnit.sortOrder,
          exercises: savedExercises,
        },
        {
          excludeExtraneousValues: true,
        }
      );
    });
  }

  /**
   * Updates a training unit's basic information (name, sortOrder)
   * Only the trainer who owns the plan can update units
   *
   * @param id - UUID of the training unit to update
   * @param dto - UpdateTrainingUnitDto with fields to update
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise with TrainingUnitResponseDto
   * @throws NotFoundException if unit doesn't exist or user doesn't have access
   */
  async update(id: string, dto: UpdateTrainingUnitDto, userId: string): Promise<TrainingUnitResponseDto> {
    // Fetch training unit with its training plan to verify ownership
    const trainingUnit = await this.trainingUnitsRepository.findOne({
      where: { id },
      relations: ["trainingPlan", "planExercises"],
    });

    if (!trainingUnit) {
      throw new NotFoundException(`Training unit with ID "${id}" not found`);
    }

    // Verify ownership - check if user is the trainer of the plan
    if (trainingUnit.trainingPlan.trainerId !== userId) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training unit with ID "${id}" not found`);
    }

    // Update only the fields that were provided
    if (dto.name !== undefined) {
      trainingUnit.name = dto.name;
    }
    if (dto.sortOrder !== undefined) {
      trainingUnit.sortOrder = dto.sortOrder;
    }

    // Save updated entity
    const updatedUnit = await this.trainingUnitsRepository.save(trainingUnit);

    // Map to response DTO with exercises
    return plainToInstance(
      TrainingUnitResponseDto,
      {
        id: updatedUnit.id,
        name: updatedUnit.name,
        sortOrder: updatedUnit.sortOrder,
        exercises: updatedUnit.planExercises ?? [],
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Deletes a training unit and all its associated exercises (cascade)
   * Only the trainer who owns the plan can delete units
   *
   * @param id - UUID of the training unit to delete
   * @param userId - ID of the authenticated user (trainer)
   * @returns Promise<void>
   * @throws NotFoundException if unit doesn't exist or user doesn't have access
   */
  async remove(id: string, userId: string): Promise<void> {
    // Fetch training unit with its training plan to verify ownership
    const trainingUnit = await this.trainingUnitsRepository.findOne({
      where: { id },
      relations: ["trainingPlan"],
    });

    if (!trainingUnit) {
      throw new NotFoundException(`Training unit with ID "${id}" not found`);
    }

    // Verify ownership - check if user is the trainer of the plan
    if (trainingUnit.trainingPlan.trainerId !== userId) {
      // Return 404 instead of 403 to avoid revealing resource existence
      throw new NotFoundException(`Training unit with ID "${id}" not found`);
    }

    // Remove the training unit (cascades to plan_exercises due to onDelete: CASCADE)
    await this.trainingUnitsRepository.remove(trainingUnit);
  }
}
