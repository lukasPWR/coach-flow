import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { ExerciseQueryDto } from "./dto/exercise-query.dto";
import { ExerciseResponseDto } from "./dto/exercise-response.dto";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { ExercisesRepository } from "./repositories/exercises.repository";

@Injectable()
export class ExercisesService {
  constructor(private readonly exercisesRepository: ExercisesRepository) { }

  /**
   * Retrieves all exercises available to the authenticated trainer.
   * Returns system exercises and exercises created by the trainer.
   *
   * @param userId - UUID of the authenticated trainer
   * @param query - Optional filters (search by name, filter by muscle group)
   * @returns Array of exercises matching the criteria
   */
  async findAll(userId: string, query: ExerciseQueryDto): Promise<ExerciseResponseDto[]> {
    const exercises = await this.exercisesRepository.findAllForTrainer(userId, {
      search: query.search,
      muscleGroup: query.muscleGroup,
    });

    // Transform entities to response DTOs
    return plainToInstance(ExerciseResponseDto, exercises, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Creates a new custom exercise for the authenticated trainer.
   * The exercise is automatically marked as non-system (isSystem: false).
   *
   * @param userId - UUID of the authenticated trainer
   * @param createExerciseDto - Data for the new exercise
   * @returns The created exercise
   */
  async create(userId: string, createExerciseDto: CreateExerciseDto): Promise<ExerciseResponseDto> {
    const exercise = await this.exercisesRepository.createExercise(
      userId,
      createExerciseDto.name,
      createExerciseDto.muscleGroup
    );

    // Transform entity to response DTO
    return plainToInstance(ExerciseResponseDto, exercise, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Soft deletes an exercise by setting the deletedAt timestamp.
   * Validates that the exercise exists, is not a system exercise, and belongs to the trainer.
   *
   * @param id - UUID of the exercise to delete
   * @param userId - UUID of the authenticated trainer
   * @throws NotFoundException if exercise does not exist
   * @throws ForbiddenException if exercise is a system exercise or belongs to another trainer
   */
  async remove(id: string, userId: string): Promise<void> {
    // Fetch the exercise from the database
    const exercise = await this.exercisesRepository.findById(id);

    // Guard clause: Exercise not found
    if (!exercise) {
      throw new NotFoundException("Exercise not found");
    }

    // Guard clause: Cannot delete system exercises
    if (exercise.isSystem) {
      throw new ForbiddenException("Cannot delete system exercises");
    }

    // Guard clause: Can only delete own exercises
    if (exercise.trainerId !== userId) {
      throw new ForbiddenException("You can only delete your own exercises");
    }

    // Perform soft delete
    await this.exercisesRepository.softDeleteExercise(id);
  }
}
