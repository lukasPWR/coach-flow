import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Exercise } from "../entities/exercise.entity";
import { MuscleGroupType } from "../interfaces/muscle-group.enum";
import { ExerciseFiltersInterface } from "../interfaces/exercise-filters.interface";

@Injectable()
export class ExercisesRepository extends Repository<Exercise> {
  constructor(private dataSource: DataSource) {
    super(Exercise, dataSource.createEntityManager());
  }

  /**
   * Finds all exercises available to a specific trainer.
   * Returns system exercises and exercises created by the trainer.
   *
   * @param userId - UUID of the trainer
   * @param filters - Optional filters (search, muscleGroup)
   * @returns Array of exercises matching the criteria
   */
  async findAllForTrainer(userId: string, filters: ExerciseFiltersInterface): Promise<Exercise[]> {
    const queryBuilder = this.createQueryBuilder("exercise").where(
      "(exercise.is_system = :isSystem OR exercise.trainer_id = :userId)",
      {
        isSystem: true,
        userId,
      }
    );

    // Apply search filter if provided
    if (filters.search) {
      queryBuilder.andWhere("exercise.name ILIKE :search", {
        search: `%${filters.search}%`,
      });
    }

    // Apply muscle group filter if provided
    if (filters.muscleGroup) {
      queryBuilder.andWhere("exercise.muscle_group = :muscleGroup", {
        muscleGroup: filters.muscleGroup,
      });
    }

    // Sort by name for consistent ordering
    queryBuilder.orderBy("exercise.name", "ASC");

    return queryBuilder.getMany();
  }

  /**
   * Creates a new custom exercise for a trainer.
   *
   * @param trainerId - UUID of the trainer creating the exercise
   * @param name - Name of the exercise
   * @param muscleGroup - Target muscle group
   * @returns The created exercise entity
   */
  async createExercise(trainerId: string, name: string, muscleGroup: MuscleGroupType): Promise<Exercise> {
    const result = await this.insert({
      trainerId,
      name,
      muscleGroup,
      isSystem: false,
    });

    const exerciseId = result.identifiers[0].id;
    const exercise = await this.findOne({ where: { id: exerciseId } });

    if (!exercise) {
      throw new Error("Failed to create exercise");
    }

    return exercise;
  }

  /**
   * Finds an exercise by ID (excluding soft-deleted records).
   *
   * @param id - UUID of the exercise
   * @returns The exercise entity or null if not found
   */
  async findById(id: string): Promise<Exercise | null> {
    return this.findOne({ where: { id } });
  }

  /**
   * Performs a soft delete on an exercise.
   * Sets the deletedAt timestamp without physically removing the record.
   *
   * @param id - UUID of the exercise to soft delete
   * @returns void
   */
  async softDeleteExercise(id: string): Promise<void> {
    await this.softDelete(id);
  }
}
