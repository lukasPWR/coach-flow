import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Unavailability } from "./entities/unavailability.entity";
import { Booking, BookingStatus } from "../bookings/entities/booking.entity";
import { CreateUnavailabilityDto } from "./dto/create-unavailability.dto";
import { UpdateUnavailabilityDto } from "./dto/update-unavailability.dto";
import { UnavailabilityResponseDto } from "./dto/unavailability-response.dto";
import { GetUnavailabilitiesQueryDto } from "./dto/get-unavailabilities-query.dto";

/**
 * Service handling business logic for unavailabilities.
 * Manages trainer unavailability periods and ensures no conflicts with bookings.
 */
@Injectable()
export class UnavailabilitiesService {
  private readonly logger = new Logger(UnavailabilitiesService.name);

  constructor(
    @InjectRepository(Unavailability)
    private readonly unavailabilityRepository: Repository<Unavailability>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>
  ) {}

  /**
   * Creates a new unavailability period for a trainer.
   *
   * Validates that:
   * - Start time is before end time
   * - No overlapping unavailabilities exist
   * - No accepted bookings exist in the time range
   *
   * @param trainerId - UUID of the trainer (from JWT token)
   * @param createDto - DTO containing start and end times
   * @returns Created unavailability as response DTO
   * @throws BadRequestException if dates are invalid
   * @throws ConflictException if time slot conflicts with existing data
   * @throws InternalServerErrorException for unexpected errors
   */
  async create(trainerId: string, createDto: CreateUnavailabilityDto): Promise<UnavailabilityResponseDto> {
    try {
      // Step 1: Parse and validate dates
      const startTime = new Date(createDto.startTime);
      const endTime = new Date(createDto.endTime);

      // Validate date parsing
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestException("Invalid date format");
      }

      // Validate that startTime is before endTime
      if (startTime >= endTime) {
        throw new BadRequestException("Start time must be before end time");
      }

      // Step 2: Check for conflicts with existing unavailabilities and bookings
      await this.checkConflicts(trainerId, startTime, endTime);

      // Step 3: Create new unavailability entity
      const unavailability = this.unavailabilityRepository.create({
        trainerId,
        startTime,
        endTime,
      });

      // Step 4: Save to database
      const savedUnavailability = await this.unavailabilityRepository.save(unavailability);

      this.logger.log(`Created unavailability ${savedUnavailability.id} for trainer ${trainerId}`);

      // Step 5: Transform to response DTO
      return new UnavailabilityResponseDto({
        id: savedUnavailability.id,
        startTime: savedUnavailability.startTime,
        endTime: savedUnavailability.endTime,
        trainerId: savedUnavailability.trainerId,
        createdAt: savedUnavailability.createdAt,
        updatedAt: savedUnavailability.updatedAt,
      });
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to create unavailability for trainer ${trainerId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to create unavailability. Please try again later.");
    }
  }

  /**
   * Retrieves a single unavailability period by ID for a specific trainer.
   *
   * Implements IDOR protection by verifying that the unavailability belongs to the trainer.
   * This is typically used to fetch details before editing or deleting.
   *
   * @param id - UUID of the unavailability
   * @param trainerId - UUID of the trainer (from JWT token)
   * @returns Unavailability period as response DTO
   * @throws NotFoundException if unavailability doesn't exist or doesn't belong to trainer
   * @throws InternalServerErrorException for unexpected database errors
   */
  async findOne(id: string, trainerId: string): Promise<UnavailabilityResponseDto> {
    try {
      // Execute query with compound condition for IDOR protection
      // This ensures the trainer can only access their own unavailabilities
      const unavailability = await this.unavailabilityRepository.findOne({
        where: { id, trainerId },
      });

      // If no result found, either record doesn't exist or belongs to another trainer
      // For security reasons, we return the same error for both cases
      if (!unavailability) {
        throw new NotFoundException("Unavailability not found or access denied");
      }

      this.logger.log(`Retrieved unavailability ${id} for trainer ${trainerId}`);

      // Transform entity to response DTO
      return new UnavailabilityResponseDto({
        id: unavailability.id,
        startTime: unavailability.startTime,
        endTime: unavailability.endTime,
        createdAt: unavailability.createdAt,
      });
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to retrieve unavailability ${id} for trainer ${trainerId}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Failed to retrieve unavailability. Please try again later.");
    }
  }

  /**
   * Retrieves all unavailability periods for a specific trainer.
   *
   * Supports optional date range filtering. When both 'from' and 'to' are provided,
   * returns only unavailabilities that overlap with the specified range.
   *
   * Overlap logic: unavailability overlaps with [from, to] if:
   * - unavailability.startTime <= to AND unavailability.endTime >= from
   *
   * @param trainerId - UUID of the trainer (from JWT token)
   * @param query - Optional date range filters
   * @returns Array of unavailability periods as response DTOs
   * @throws InternalServerErrorException for unexpected database errors
   */
  async findAll(trainerId: string, query: GetUnavailabilitiesQueryDto): Promise<UnavailabilityResponseDto[]> {
    try {
      // Build query with trainerId filter (row-level security)
      const queryBuilder = this.unavailabilityRepository
        .createQueryBuilder("unavailability")
        .where("unavailability.trainerId = :trainerId", { trainerId })
        .orderBy("unavailability.startTime", "ASC");

      // Apply date range filters if provided
      // Logic: unavailability overlaps with [from, to] if:
      // unavailability.startTime <= to AND unavailability.endTime >= from
      if (query.from && query.to) {
        const fromDate = new Date(query.from);
        const toDate = new Date(query.to);

        queryBuilder
          .andWhere("unavailability.startTime <= :toDate", { toDate })
          .andWhere("unavailability.endTime >= :fromDate", { fromDate });
      } else if (query.from) {
        // Only 'from' provided: get unavailabilities that end on or after 'from'
        const fromDate = new Date(query.from);
        queryBuilder.andWhere("unavailability.endTime >= :fromDate", { fromDate });
      } else if (query.to) {
        // Only 'to' provided: get unavailabilities that start on or before 'to'
        const toDate = new Date(query.to);
        queryBuilder.andWhere("unavailability.startTime <= :toDate", { toDate });
      }

      // Execute query
      const unavailabilities = await queryBuilder.getMany();

      this.logger.log(`Retrieved ${unavailabilities.length} unavailabilities for trainer ${trainerId}`);

      // Transform entities to response DTOs
      // Note: trainerId is not included in GET response as trainer only sees their own data
      return unavailabilities.map(
        (unavailability) =>
          new UnavailabilityResponseDto({
            id: unavailability.id,
            startTime: unavailability.startTime,
            endTime: unavailability.endTime,
            createdAt: unavailability.createdAt,
          })
      );
    } catch (error) {
      // Log and wrap unexpected errors
      this.logger.error(`Failed to retrieve unavailabilities for trainer ${trainerId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve unavailabilities. Please try again later.");
    }
  }

  /**
   * Updates an existing unavailability period for a trainer.
   *
   * Validates that:
   * - The unavailability exists and belongs to the trainer (IDOR protection)
   * - Start time is before end time (if both are provided or changed)
   * - No overlapping unavailabilities exist (excluding the current record)
   * - No accepted bookings exist in the new time range
   *
   * @param id - UUID of the unavailability to update
   * @param trainerId - UUID of the trainer (from JWT token)
   * @param updateDto - DTO containing optional start and end times
   * @returns Updated unavailability as response DTO
   * @throws NotFoundException if unavailability doesn't exist or doesn't belong to trainer
   * @throws BadRequestException if dates are invalid
   * @throws ConflictException if time slot conflicts with existing data
   * @throws InternalServerErrorException for unexpected errors
   */
  async update(id: string, trainerId: string, updateDto: UpdateUnavailabilityDto): Promise<UnavailabilityResponseDto> {
    try {
      // Step 1: Fetch the existing unavailability record
      // This ensures IDOR protection by checking trainerId
      const existingUnavailability = await this.unavailabilityRepository.findOne({
        where: { id, trainerId },
      });

      if (!existingUnavailability) {
        throw new NotFoundException("Unavailability not found or access denied");
      }

      // Step 2: Merge new values with existing ones
      // Use provided values from DTO, otherwise keep existing values
      const newStartTime = updateDto.startTime ? new Date(updateDto.startTime) : existingUnavailability.startTime;
      const newEndTime = updateDto.endTime ? new Date(updateDto.endTime) : existingUnavailability.endTime;

      // Validate date parsing if new dates were provided
      if (updateDto.startTime && isNaN(newStartTime.getTime())) {
        throw new BadRequestException("Invalid start time format");
      }
      if (updateDto.endTime && isNaN(newEndTime.getTime())) {
        throw new BadRequestException("Invalid end time format");
      }

      // Step 3: Validate that startTime is before endTime
      if (newStartTime >= newEndTime) {
        throw new BadRequestException("Start time must be before end time");
      }

      // Step 4: Check for conflicts with existing unavailabilities and bookings
      // IMPORTANT: Exclude the current record (id) to avoid false positive conflict with itself
      await this.checkConflictsForUpdate(trainerId, newStartTime, newEndTime, id);

      // Step 5: Update the entity
      existingUnavailability.startTime = newStartTime;
      existingUnavailability.endTime = newEndTime;

      // Step 6: Save to database
      const updatedUnavailability = await this.unavailabilityRepository.save(existingUnavailability);

      this.logger.log(`Updated unavailability ${id} for trainer ${trainerId}`);

      // Step 7: Transform to response DTO
      return new UnavailabilityResponseDto({
        id: updatedUnavailability.id,
        startTime: updatedUnavailability.startTime,
        endTime: updatedUnavailability.endTime,
        trainerId: updatedUnavailability.trainerId,
        createdAt: updatedUnavailability.createdAt,
        updatedAt: updatedUnavailability.updatedAt,
      });
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to update unavailability ${id} for trainer ${trainerId}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Failed to update unavailability. Please try again later.");
    }
  }

  /**
   * Checks for conflicts with existing unavailabilities and accepted bookings.
   *
   * A conflict exists if:
   * - Another unavailability overlaps with the given time range
   * - An accepted booking exists in the given time range
   *
   * Time ranges overlap if:
   * - new.start < existing.end AND new.end > existing.start
   *
   * @param trainerId - UUID of the trainer
   * @param startTime - Start of the new unavailability period
   * @param endTime - End of the new unavailability period
   * @throws ConflictException if any conflict is detected
   */
  private async checkConflicts(trainerId: string, startTime: Date, endTime: Date): Promise<void> {
    // Check for overlapping unavailabilities
    // Two time ranges overlap if: start1 < end2 AND end1 > start2
    const overlappingUnavailability = await this.unavailabilityRepository
      .createQueryBuilder("unavailability")
      .where("unavailability.trainerId = :trainerId", { trainerId })
      .andWhere("unavailability.startTime < :endTime", { endTime })
      .andWhere("unavailability.endTime > :startTime", { startTime })
      .getOne();

    if (overlappingUnavailability) {
      throw new ConflictException("Time slot conflicts with an existing unavailability period");
    }

    // Check for overlapping accepted bookings
    const overlappingBooking = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.trainerId = :trainerId", { trainerId })
      .andWhere("booking.status = :status", { status: BookingStatus.ACCEPTED })
      .andWhere("booking.startTime < :endTime", { endTime })
      .andWhere("booking.endTime > :startTime", { startTime })
      .getOne();

    if (overlappingBooking) {
      throw new ConflictException("Time slot conflicts with an accepted booking");
    }
  }

  /**
   * Removes an unavailability period for a trainer.
   *
   * Implements IDOR protection by verifying that the unavailability belongs to the trainer.
   * Uses atomic delete operation with compound condition (id + trainerId).
   *
   * @param id - UUID of the unavailability to remove
   * @param trainerId - UUID of the trainer (from JWT token)
   * @throws NotFoundException if unavailability doesn't exist or doesn't belong to trainer
   * @throws InternalServerErrorException for unexpected database errors
   */
  async remove(id: string, trainerId: string): Promise<void> {
    try {
      // Execute atomic delete with compound condition for IDOR protection
      // This ensures the trainer can only delete their own unavailabilities
      const result = await this.unavailabilityRepository.delete({
        id,
        trainerId,
      });

      // Check if any rows were affected
      // affected === 0 means either:
      // 1. Record doesn't exist, OR
      // 2. Record exists but belongs to another trainer
      // For security reasons, we return the same error for both cases
      if (!result.affected || result.affected === 0) {
        throw new NotFoundException("Unavailability not found or access denied");
      }

      this.logger.log(`Deleted unavailability ${id} for trainer ${trainerId}`);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(
        `Failed to delete unavailability ${id} for trainer ${trainerId}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException("Failed to delete unavailability. Please try again later.");
    }
  }

  /**
   * Checks for conflicts when updating an unavailability.
   * Similar to checkConflicts but excludes the current record being updated.
   *
   * @param trainerId - UUID of the trainer
   * @param startTime - Start of the updated unavailability period
   * @param endTime - End of the updated unavailability period
   * @param excludeId - UUID of the unavailability being updated (to exclude from conflict check)
   * @throws ConflictException if any conflict is detected
   */
  private async checkConflictsForUpdate(
    trainerId: string,
    startTime: Date,
    endTime: Date,
    excludeId: string
  ): Promise<void> {
    // Check for overlapping unavailabilities, excluding the current record
    const overlappingUnavailability = await this.unavailabilityRepository
      .createQueryBuilder("unavailability")
      .where("unavailability.trainerId = :trainerId", { trainerId })
      .andWhere("unavailability.id != :excludeId", { excludeId })
      .andWhere("unavailability.startTime < :endTime", { endTime })
      .andWhere("unavailability.endTime > :startTime", { startTime })
      .getOne();

    if (overlappingUnavailability) {
      throw new ConflictException("Time slot conflicts with an existing unavailability period");
    }

    // Check for overlapping accepted bookings (same as in create)
    const overlappingBooking = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.trainerId = :trainerId", { trainerId })
      .andWhere("booking.status = :status", { status: BookingStatus.ACCEPTED })
      .andWhere("booking.startTime < :endTime", { endTime })
      .andWhere("booking.endTime > :startTime", { startTime })
      .getOne();

    if (overlappingBooking) {
      throw new ConflictException("Time slot conflicts with an accepted booking");
    }
  }
}
