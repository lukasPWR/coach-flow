import { Injectable } from "@nestjs/common";
import { DataSource, Repository, FindOptionsWhere } from "typeorm";
import { PlanExercise } from "../entities/plan-exercise.entity";

/**
 * Custom repository for PlanExercise entity
 * Provides database operations for plan exercises
 */
@Injectable()
export class PlanExercisesRepository extends Repository<PlanExercise> {
  constructor(private dataSource: DataSource) {
    super(PlanExercise, dataSource.createEntityManager());
  }

  /**
   * Calculates the next sort order for a new exercise in a training unit
   * Returns the maximum current sort order + 1, or 0 if no exercises exist
   *
   * @param trainingUnitId - UUID of the training unit
   * @returns Promise with the next sort order number
   */
  async getNextSortOrder(trainingUnitId: string): Promise<number> {
    const result = await this.createQueryBuilder("planExercise")
      .select("MAX(planExercise.sortOrder)", "maxOrder")
      .where("planExercise.trainingUnitId = :trainingUnitId", { trainingUnitId })
      .getRawOne();

    return result?.maxOrder !== null ? result.maxOrder + 1 : 0;
  }

  /**
   * Finds all exercises for a specific training unit
   * Orders by sortOrder ascending
   *
   * @param trainingUnitId - UUID of the training unit
   * @returns Promise with array of PlanExercise entities
   */
  async findByTrainingUnitId(trainingUnitId: string): Promise<PlanExercise[]> {
    return this.find({
      where: { trainingUnitId },
      relations: ["exercise"],
      order: { sortOrder: "ASC" },
    });
  }

  /**
   * Finds a single plan exercise with its related exercise
   *
   * @param where - Find conditions
   * @returns Promise with PlanExercise entity or null
   */
  async findOneWithExercise(where: FindOptionsWhere<PlanExercise>): Promise<PlanExercise | null> {
    return this.findOne({
      where,
      relations: ["exercise"],
    });
  }

  /**
   * Finds a single plan exercise with relations needed for authorization
   * Includes trainingUnit and trainingPlan to verify ownership
   *
   * @param where - Find conditions
   * @returns Promise with PlanExercise entity including relations or null
   */
  async findOneWithOwnership(where: FindOptionsWhere<PlanExercise>): Promise<PlanExercise | null> {
    return this.findOne({
      where,
      relations: ["trainingUnit", "trainingUnit.trainingPlan", "exercise"],
    });
  }
}
