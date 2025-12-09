import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { BookingBan } from "./entities/booking-ban.entity";
import { CreateBookingBanDto } from "./dto/create-booking-ban.dto";
import { UpdateBookingBanDto } from "./dto/update-booking-ban.dto";
import { BookingBanResponseDto } from "./dto/booking-ban-response.dto";
import { PaginatedBookingBansResponseDto } from "./dto/paginated-booking-bans-response.dto";
import { User } from "../users/entities/user.entity";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { PaginationMetaDto } from "../common/dto/pagination-meta.dto";

/**
 * Service responsible for managing booking bans.
 *
 * Provides business logic for creating and managing booking ban restrictions.
 */
@Injectable()
export class BookingBansService {
  private readonly logger = new Logger(BookingBansService.name);

  constructor(
    @InjectRepository(BookingBan)
    private readonly bookingBanRepository: Repository<BookingBan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Creates a new booking ban.
   *
   * This method creates a restriction that prevents a client from booking
   * with a specific trainer until the specified date.
   *
   * @param createBookingBanDto - DTO containing ban creation data
   * @returns The newly created booking ban entity
   */
  async create(createBookingBanDto: CreateBookingBanDto): Promise<BookingBan> {
    const bannedUntilDate = new Date(createBookingBanDto.bannedUntil);
    if (Number.isNaN(bannedUntilDate.getTime())) {
      throw new BadRequestException("bannedUntil must be a valid date");
    }

    const now = new Date();
    if (bannedUntilDate <= now) {
      throw new BadRequestException("bannedUntil must be a future date");
    }

    try {
      const [client, trainer] = await Promise.all([
        this.userRepository.findOne({ where: { id: createBookingBanDto.clientId } }),
        this.userRepository.findOne({ where: { id: createBookingBanDto.trainerId } }),
      ]);

      if (!client) {
        throw new BadRequestException("Client not found");
      }

      if (!trainer) {
        throw new BadRequestException("Trainer not found");
      }

      const existingActiveBan = await this.bookingBanRepository.findOne({
        where: {
          clientId: createBookingBanDto.clientId,
          trainerId: createBookingBanDto.trainerId,
          bannedUntil: MoreThan(now),
        },
      });

      if (existingActiveBan) {
        existingActiveBan.bannedUntil = bannedUntilDate;
        const updatedBookingBan = await this.bookingBanRepository.save(existingActiveBan);

        this.logger.log(
          `Booking ban updated: Client ${createBookingBanDto.clientId} banned from trainer ${createBookingBanDto.trainerId} until ${bannedUntilDate.toISOString()}`
        );

        return updatedBookingBan;
      }

      const bookingBan = this.bookingBanRepository.create({
        ...createBookingBanDto,
        bannedUntil: bannedUntilDate,
      });

      const savedBookingBan = await this.bookingBanRepository.save(bookingBan);

      this.logger.log(
        `Booking ban created: Client ${createBookingBanDto.clientId} banned from trainer ${createBookingBanDto.trainerId} until ${createBookingBanDto.bannedUntil}`
      );

      return savedBookingBan;
    } catch (error) {
      this.logger.error(`Failed to create booking ban: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves a single booking ban by its ID.
   *
   * Fetches the booking ban with related client and trainer information.
   * Throws NotFoundException if the ban does not exist.
   *
   * @param id - UUID of the booking ban to retrieve
   * @returns BookingBanResponseDto with complete ban details
   * @throws NotFoundException if booking ban is not found
   */
  async findOne(id: string): Promise<BookingBanResponseDto> {
    try {
      const bookingBan = await this.bookingBanRepository.findOne({
        where: { id },
        relations: ["client", "trainer"],
      });

      if (!bookingBan) {
        throw new NotFoundException(`Booking ban with ID ${id} not found`);
      }

      // Map entity to response DTO
      return {
        id: bookingBan.id,
        bannedUntil: bookingBan.bannedUntil,
        client: {
          id: bookingBan.client.id,
          name: bookingBan.client.name,
          email: bookingBan.client.email,
        },
        trainer: {
          id: bookingBan.trainer.id,
          name: bookingBan.trainer.name,
          email: bookingBan.trainer.email,
        },
        createdAt: bookingBan.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve booking ban with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Updates an existing booking ban.
   *
   * Allows partial update of a booking ban, primarily for extending or shortening
   * the ban period by modifying the bannedUntil date.
   *
   * @param id - UUID of the booking ban to update
   * @param updateDto - DTO containing fields to update
   * @returns BookingBanResponseDto with updated ban details
   * @throws NotFoundException if booking ban is not found
   * @throws BadRequestException if bannedUntil date is not in the future
   */
  async update(id: string, updateDto: UpdateBookingBanDto): Promise<BookingBanResponseDto> {
    try {
      // Find the existing booking ban
      const bookingBan = await this.bookingBanRepository.findOne({
        where: { id },
      });

      if (!bookingBan) {
        throw new NotFoundException(`Booking ban with ID ${id} not found`);
      }

      // Validate bannedUntil if provided
      if (updateDto.bannedUntil) {
        const bannedUntilDate = new Date(updateDto.bannedUntil);
        
        if (Number.isNaN(bannedUntilDate.getTime())) {
          throw new BadRequestException("bannedUntil must be a valid date");
        }

        const now = new Date();
        if (bannedUntilDate <= now) {
          throw new BadRequestException("bannedUntil must be a future date");
        }

        // Update the bannedUntil field
        bookingBan.bannedUntil = bannedUntilDate;
      }

      // Save the updated entity
      await this.bookingBanRepository.save(bookingBan);

      // Fetch the updated entity with relations
      const updatedBookingBan = await this.bookingBanRepository.findOne({
        where: { id },
        relations: ["client", "trainer"],
      });

      this.logger.log(
        `Booking ban updated: ID ${id}, new bannedUntil: ${updatedBookingBan.bannedUntil.toISOString()}`
      );

      // Map to response DTO
      return {
        id: updatedBookingBan.id,
        bannedUntil: updatedBookingBan.bannedUntil,
        client: {
          id: updatedBookingBan.client.id,
          name: updatedBookingBan.client.name,
          email: updatedBookingBan.client.email,
        },
        trainer: {
          id: updatedBookingBan.trainer.id,
          name: updatedBookingBan.trainer.name,
          email: updatedBookingBan.trainer.email,
        },
        createdAt: updatedBookingBan.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update booking ban with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves a paginated list of all booking bans.
   *
   * Fetches booking bans with related client and trainer information.
   * Supports pagination to efficiently handle large datasets.
   *
   * @param query - Pagination parameters (page and limit)
   * @returns PaginatedBookingBansResponseDto with booking bans and pagination metadata
   */
  async findAll(query: PaginationQueryDto): Promise<PaginatedBookingBansResponseDto> {
    try {
      const { page, limit } = query;

      // Calculate skip and take for pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Fetch booking bans with count and relations
      const [bookingBans, totalItems] = await this.bookingBanRepository.findAndCount({
        skip,
        take,
        relations: ["client", "trainer"],
        order: {
          createdAt: "DESC", // Most recent bans first
        },
      });

      // Map entities to response DTOs
      const data: BookingBanResponseDto[] = bookingBans.map((ban) => ({
        id: ban.id,
        bannedUntil: ban.bannedUntil,
        client: {
          id: ban.client.id,
          name: ban.client.name,
          email: ban.client.email,
        },
        trainer: {
          id: ban.trainer.id,
          name: ban.trainer.name,
          email: ban.trainer.email,
        },
        createdAt: ban.createdAt,
      }));

      // Create pagination metadata
      const meta = new PaginationMetaDto(totalItems, limit, page);

      this.logger.log(
        `Retrieved ${data.length} booking bans (page ${page}, total: ${totalItems})`
      );

      return new PaginatedBookingBansResponseDto(data, meta);
    } catch (error) {
      this.logger.error(`Failed to retrieve booking bans: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Permanently removes a booking ban from the system.
   *
   * Deletes the booking ban with the specified ID. This operation is permanent
   * and cannot be undone. Throws NotFoundException if the ban does not exist.
   *
   * @param id - UUID of the booking ban to remove
   * @returns Promise<void>
   * @throws NotFoundException if booking ban is not found
   */
  async remove(id: string): Promise<void> {
    try {
      // Execute delete operation
      const result = await this.bookingBanRepository.delete(id);

      // Check if any rows were affected
      if (result.affected === 0) {
        throw new NotFoundException(`Booking ban with ID ${id} not found`);
      }

      this.logger.log(`Booking ban with ID ${id} successfully deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete booking ban with ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
