import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { TrainingPlan } from "../entities/training-plan.entity";
import { TrainingPlanFilters } from "../interfaces/training-plan-filters.interface";

/**
 * Repository for TrainingPlan entity
 * Contains data access methods with appropriate filtering logic
 */
@Injectable()
export class TrainingPlansRepository extends Repository<TrainingPlan> {
  constructor(private dataSource: DataSource) {
    super(TrainingPlan, dataSource.createEntityManager());
  }

  /**
   * Retrieves list of training plans with filtering
   * @param filters - Object containing filters (trainerId, clientId, status)
   * @returns Promise with array of training plans
   */
  async findAll(filters: TrainingPlanFilters): Promise<TrainingPlan[]> {
    const queryBuilder = this.createQueryBuilder("trainingPlan");

    // Filter by trainerId
    if (filters.trainerId) {
      queryBuilder.andWhere("trainingPlan.trainerId = :trainerId", {
        trainerId: filters.trainerId,
      });
    }

    // Filter by clientId
    if (filters.clientId) {
      queryBuilder.andWhere("trainingPlan.clientId = :clientId", {
        clientId: filters.clientId,
      });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere("trainingPlan.status = :status", {
        status: filters.status,
      });
    }

    // Sort by newest plans first
    queryBuilder.orderBy("trainingPlan.createdAt", "DESC");

    return queryBuilder.getMany();
  }

  /**
   * Retrieves a single training plan with nested units and exercises
   * Includes soft-deleted exercises to preserve exercise names in plans
   *
   * @param id - Training plan UUID
   * @returns Promise with training plan or null if not found
   */
  async findOneWithDetails(id: string): Promise<TrainingPlan | null> {
    const queryBuilder = this.createQueryBuilder("trainingPlan")
      .leftJoinAndSelect("trainingPlan.trainingUnits", "units")
      .leftJoinAndSelect("units.planExercises", "planExercises")
      .leftJoinAndSelect("planExercises.exercise", "exercise")
      .where("trainingPlan.id = :id", { id })
      // Order units by sortOrder ascending
      .orderBy("units.sortOrder", "ASC")
      // Order exercises within units by sortOrder ascending
      .addOrderBy("planExercises.sortOrder", "ASC")
      // Include soft-deleted exercises to preserve names
      .withDeleted();

    const plan = await queryBuilder.getOne();
    return plan;
  }
}
