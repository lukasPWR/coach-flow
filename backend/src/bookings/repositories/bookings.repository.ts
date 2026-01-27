import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { Booking, BookingStatus } from "../entities/booking.entity";
import { UserRole } from "../../users/interfaces/user-role.enum";

/**
 * Interface for trainer's client data returned by findUniqueClientsByTrainerId
 */
export interface TrainerClientData {
  id: string;
  name: string;
  email: string;
}

/**
 * Interface for booked slot data
 */
export interface BookedSlotData {
  startTime: Date;
  endTime: Date;
}

/**
 * Repository for Booking entity
 * Contains data access methods with database queries
 */
@Injectable()
export class BookingsRepository extends Repository<Booking> {
  constructor(private dataSource: DataSource) {
    super(Booking, dataSource.createEntityManager());
  }

  /**
   * Finds unique clients who have booking history with a specific trainer.
   * Returns distinct clients with CLIENT role, sorted alphabetically by name.
   *
   * @param trainerId - UUID of the trainer
   * @returns Array of unique clients with id, name, and email
   */
  async findUniqueClientsByTrainerId(trainerId: string): Promise<TrainerClientData[]> {
    const results = await this.createQueryBuilder("booking")
      .innerJoin("booking.client", "client")
      .where("booking.trainerId = :trainerId", { trainerId })
      .andWhere("client.role = :role", { role: UserRole.CLIENT })
      .select(["client.id", "client.name", "client.email"])
      .distinct(true)
      .orderBy("client.name", "ASC")
      .getRawMany();

    return results.map((row) => ({
      id: row.client_id,
      name: row.client_name,
      email: row.client_email,
    }));
  }

  /**
   * Finds booked time slots for a trainer within optional date range.
   * Excludes cancelled bookings.
   *
   * @param trainerId - UUID of the trainer
   * @param from - Optional start date filter (ISO string)
   * @param to - Optional end date filter (ISO string)
   * @returns Array of booked slots with startTime and endTime
   */
  async findBookedSlotsByTrainerId(trainerId: string, from?: string, to?: string): Promise<BookedSlotData[]> {
    const queryBuilder = this.createQueryBuilder("booking")
      .select(["booking.startTime", "booking.endTime"])
      .where("booking.trainerId = :trainerId", { trainerId })
      .andWhere("booking.status != :cancelledStatus", {
        cancelledStatus: BookingStatus.CANCELLED,
      });

    if (from && to) {
      queryBuilder
        .andWhere("booking.startTime < :to", { to: new Date(to) })
        .andWhere("booking.endTime > :from", { from: new Date(from) });
    } else if (from) {
      queryBuilder.andWhere("booking.endTime >= :from", { from: new Date(from) });
    } else if (to) {
      queryBuilder.andWhere("booking.startTime <= :to", { to: new Date(to) });
    }

    const bookings = await queryBuilder.getMany();

    return bookings.map((booking) => ({
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
  }
}
