import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { TrainingUnit } from "../entities/training-unit.entity";

/**
 * Repository for TrainingUnit entity
 * Contains data access methods for training units
 */
@Injectable()
export class TrainingUnitsRepository extends Repository<TrainingUnit> {
  constructor(private dataSource: DataSource) {
    super(TrainingUnit, dataSource.createEntityManager());
  }

  /**
   * Calculates the next sort order for a new training unit in a plan
   * Returns the maximum sortOrder + 1, or 0 if the plan has no units yet
   *
   * @param trainingPlanId - UUID of the training plan
   * @returns Promise with the next sort order value
   */
  async getNextSortOrder(trainingPlanId: string): Promise<number> {
    const result = await this.createQueryBuilder("trainingUnit")
      .select("MAX(trainingUnit.sortOrder)", "maxSortOrder")
      .where("trainingUnit.trainingPlanId = :trainingPlanId", { trainingPlanId })
      .getRawOne<{ maxSortOrder: number | null }>();

    return result && result.maxSortOrder !== null ? result.maxSortOrder + 1 : 0;
  }
}
