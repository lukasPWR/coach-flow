import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { TrainingUnitsRepository } from "./repositories/training-units.repository";
import { TrainingPlansRepository } from "../training-plans/repositories/training-plans.repository";
import { CreateTrainingUnitDto } from "./dto/create-training-unit.dto";
import { TrainingUnitResponseDto } from "../training-plans/dto/training-unit-response.dto";
import { TrainingUnit } from "./entities/training-unit.entity";

/**
 * Service handling business logic for training units
 */
@Injectable()
export class TrainingUnitsService {
  constructor(
    private readonly trainingUnitsRepository: TrainingUnitsRepository,
    private readonly trainingPlansRepository: TrainingPlansRepository
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
}
