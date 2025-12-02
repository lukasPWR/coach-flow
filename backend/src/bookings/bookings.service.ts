import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan, SelectQueryBuilder } from "typeorm";
import { Booking, BookingStatus } from "./entities/booking.entity";
import { Service } from "../services/entities/service.entity";
import { User } from "../users/entities/user.entity";
import { BookingBan } from "../booking-bans/entities/booking-ban.entity";
import { Unavailability } from "../unavailabilities/entities/unavailability.entity";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { GetBookingsQueryDto, UserBookingRole } from "./dto/get-bookings-query.dto";
import {
  PaginatedBookingsResponseDto,
  createPaginationMeta,
  mapBookingToResponseDto,
  BookingDetailsResponseDto,
  mapBookingToDetailsResponseDto,
} from "./dto/paginated-bookings-response.dto";
import { BookingBansService } from "../booking-bans/booking-bans.service";

/**
 * Service responsible for managing bookings.
 *
 * Provides business logic for creating, validating, and managing booking requests.
 * Handles availability checks, ban verification, and time slot conflict detection.
 */
@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(BookingBan)
    private readonly bookingBanRepository: Repository<BookingBan>,

    @InjectRepository(Unavailability)
    private readonly unavailabilityRepository: Repository<Unavailability>,

    private readonly bookingBansService: BookingBansService
  ) {}

  /**
   * Creates a new booking request.
   *
   * The process includes:
   * 1. Checking if the client has an active booking ban for this trainer
   * 2. Verifying the service exists and belongs to the specified trainer
   * 3. Calculating the end time based on service duration
   * 4. Checking for time slot conflicts (other bookings or unavailabilities)
   * 5. Creating the booking with PENDING status
   *
   * @param clientId - The UUID of the client making the booking (from JWT token)
   * @param createBookingDto - The booking creation data
   * @returns The newly created booking
   * @throws ForbiddenException if client is banned from making bookings
   * @throws NotFoundException if service or trainer is not found
   * @throws BadRequestException if time slot is not available or invalid
   */
  async create(clientId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    const { trainerId, serviceId, startTime } = createBookingDto;
    const startDateTime = new Date(startTime);

    // Validate that the booking is not in the past
    if (startDateTime <= new Date()) {
      throw new BadRequestException("Cannot book a time in the past.");
    }

    try {
      // Step 1: Check if the client has an active booking ban for this trainer
      await this.checkClientBan(clientId, trainerId);

      // Step 2: Get the service and verify it belongs to the trainer
      const service = await this.getServiceAndValidateTrainer(serviceId, trainerId);

      // Step 3: Calculate end time based on service duration
      const endDateTime = new Date(startDateTime.getTime() + service.durationMinutes * 60 * 1000);

      // Step 4: Check for time slot conflicts
      await this.checkTimeSlotAvailability(trainerId, startDateTime, endDateTime);

      // Step 5: Create and save the booking
      const booking = this.bookingRepository.create({
        clientId,
        trainerId,
        serviceId,
        startTime: startDateTime,
        endTime: endDateTime,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await this.bookingRepository.save(booking);

      this.logger.log(
        `Booking created successfully: ${savedBooking.id} for client ${clientId} with trainer ${trainerId}`
      );

      return savedBooking;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to create booking: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to create booking. Please try again later.");
    }
  }

  /**
   * Checks if the client has an active booking ban for the specified trainer.
   *
   * @param clientId - The UUID of the client
   * @param trainerId - The UUID of the trainer
   * @throws ForbiddenException if an active ban exists
   */
  private async checkClientBan(clientId: string, trainerId: string): Promise<void> {
    const activeBan = await this.bookingBanRepository.findOne({
      where: {
        clientId,
        trainerId,
        bannedUntil: MoreThan(new Date()),
      },
    });

    if (activeBan) {
      throw new ForbiddenException("You are currently banned from making bookings.");
    }
  }

  /**
   * Retrieves the service and validates that it belongs to the specified trainer.
   *
   * @param serviceId - The UUID of the service
   * @param trainerId - The UUID of the trainer
   * @returns The service entity
   * @throws NotFoundException if the service is not found
   * @throws BadRequestException if the service doesn't belong to the trainer
   */
  private async getServiceAndValidateTrainer(serviceId: string, trainerId: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    if (service.trainerId !== trainerId) {
      throw new BadRequestException("Service does not belong to the specified trainer");
    }

    // Also verify that the trainer exists
    const trainer = await this.userRepository.findOne({
      where: { id: trainerId },
    });

    if (!trainer) {
      throw new NotFoundException("Trainer not found");
    }

    return service;
  }

  /**
   * Checks if the requested time slot is available for the trainer.
   *
   * Verifies there are no conflicts with:
   * - Existing bookings (excluding CANCELLED status)
   * - Trainer unavailability periods
   *
   * @param trainerId - The UUID of the trainer
   * @param startTime - The requested start time
   * @param endTime - The calculated end time
   * @throws BadRequestException if the time slot is not available
   */
  private async checkTimeSlotAvailability(trainerId: string, startTime: Date, endTime: Date): Promise<void> {
    // Check for conflicting bookings (where time ranges overlap)
    // Two time ranges overlap if: start1 < end2 AND start2 < end1
    const conflictingBooking = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.trainerId = :trainerId", { trainerId })
      .andWhere("booking.status != :cancelledStatus", {
        cancelledStatus: BookingStatus.CANCELLED,
      })
      .andWhere("booking.startTime < :endTime", { endTime })
      .andWhere("booking.endTime > :startTime", { startTime })
      .getOne();

    if (conflictingBooking) {
      throw new BadRequestException("The selected time slot is not available.");
    }

    // Check for trainer unavailability periods
    const conflictingUnavailability = await this.unavailabilityRepository
      .createQueryBuilder("unavailability")
      .where("unavailability.trainerId = :trainerId", { trainerId })
      .andWhere("unavailability.startTime < :endTime", { endTime })
      .andWhere("unavailability.endTime > :startTime", { startTime })
      .getOne();

    if (conflictingUnavailability) {
      throw new BadRequestException("The selected time slot is not available.");
    }
  }

  /**
   * Retrieves a paginated list of bookings for the specified user.
   *
   * Supports filtering by:
   * - Booking status (PENDING, ACCEPTED, REJECTED, CANCELLED)
   * - Role perspective (client or trainer)
   *
   * The query automatically filters bookings where the user is either
   * the client or the trainer, unless a specific role is specified.
   *
   * @param userId - The UUID of the authenticated user
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Paginated response with bookings and metadata
   * @throws InternalServerErrorException if database query fails
   */
  async findUserBookings(userId: string, queryDto: GetBookingsQueryDto): Promise<PaginatedBookingsResponseDto> {
    const { status, role, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.bookingRepository
        .createQueryBuilder("booking")
        .leftJoinAndSelect("booking.client", "client")
        .leftJoinAndSelect("booking.trainer", "trainer")
        .leftJoinAndSelect("booking.service", "service")
        .leftJoinAndSelect("service.serviceType", "serviceType");

      // Build WHERE clause based on role parameter
      this.applyUserFilter(queryBuilder, userId, role);

      // Apply status filter if provided
      if (status) {
        queryBuilder.andWhere("booking.status = :status", { status });
      }

      // Order by start time descending (most recent first)
      queryBuilder.orderBy("booking.startTime", "DESC");

      // Apply pagination
      queryBuilder.skip(skip).take(limit);

      // Execute query with count
      const [bookings, totalItems] = await queryBuilder.getManyAndCount();

      // Map entities to response DTOs
      const data = bookings.map(mapBookingToResponseDto);

      // Create pagination metadata
      const meta = createPaginationMeta(totalItems, data.length, limit, page);

      return { data, meta };
    } catch (error) {
      this.logger.error(`Failed to retrieve bookings for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve bookings. Please try again later.");
    }
  }

  /**
   * Applies user filter to the query builder based on the role parameter.
   *
   * @param queryBuilder - TypeORM query builder
   * @param userId - The UUID of the user
   * @param role - Optional role perspective (client or trainer)
   */
  private applyUserFilter(queryBuilder: SelectQueryBuilder<Booking>, userId: string, role?: UserBookingRole): void {
    if (role === UserBookingRole.CLIENT) {
      queryBuilder.where("booking.clientId = :userId", { userId });
    } else if (role === UserBookingRole.TRAINER) {
      queryBuilder.where("booking.trainerId = :userId", { userId });
    } else {
      // Default: show bookings where user is either client or trainer
      queryBuilder.where("(booking.clientId = :userId OR booking.trainerId = :userId)", { userId });
    }
  }

  /**
   * Approves a pending booking.
   *
   * Only trainers can approve their own bookings that are in PENDING status.
   * The booking status is changed from PENDING to ACCEPTED.
   *
   * @param bookingId - The UUID of the booking to approve
   * @param trainerId - The UUID of the authenticated trainer (from JWT token)
   * @returns The updated booking with ACCEPTED status
   * @throws NotFoundException if the booking is not found or doesn't belong to the trainer
   * @throws ConflictException if the booking is not in PENDING status
   */
  async approveBooking(bookingId: string, trainerId: string): Promise<Booking> {
    try {
      // Step 1: Find the booking by ID
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      // Step 2: Check if booking exists
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      // Step 3: Verify ownership - trainer can only approve their own bookings
      // Using 404 to not reveal existence of bookings belonging to other trainers
      if (booking.trainerId !== trainerId) {
        throw new NotFoundException("Booking not found");
      }

      // Step 4: Verify booking is in PENDING status
      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException("Booking is not in PENDING status");
      }

      // Step 5: Update status to ACCEPTED
      booking.status = BookingStatus.ACCEPTED;

      // Step 6: Save and return the updated booking
      const updatedBooking = await this.bookingRepository.save(booking);

      this.logger.log(`Booking ${bookingId} approved by trainer ${trainerId}. Status: ACCEPTED.`);

      return updatedBooking;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to approve booking ${bookingId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to approve booking. Please try again later.");
    }
  }

  /**
   * Rejects a pending booking.
   *
   * Only trainers can reject their own bookings that are in PENDING status.
   * The booking status is changed from PENDING to REJECTED.
   *
   * @param bookingId - The UUID of the booking to reject
   * @param trainerId - The UUID of the authenticated trainer (from JWT token)
   * @returns The updated booking with REJECTED status
   * @throws NotFoundException if the booking is not found or doesn't belong to the trainer
   * @throws ConflictException if the booking is not in PENDING status
   */
  async rejectBooking(bookingId: string, trainerId: string): Promise<Booking> {
    try {
      // Step 1: Find the booking by ID
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      // Step 2: Check if booking exists
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      // Step 3: Verify ownership - trainer can only reject their own bookings
      // Using 404 to not reveal existence of bookings belonging to other trainers
      if (booking.trainerId !== trainerId) {
        throw new NotFoundException("Booking not found");
      }

      // Step 4: Verify booking is in PENDING status
      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException("Booking is not in PENDING status");
      }

      // Step 5: Update status to REJECTED
      booking.status = BookingStatus.REJECTED;

      // Step 6: Save and return the updated booking
      const updatedBooking = await this.bookingRepository.save(booking);

      this.logger.log(`Booking ${bookingId} rejected by trainer ${trainerId}. Status: REJECTED.`);

      return updatedBooking;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to reject booking ${bookingId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to reject booking. Please try again later.");
    }
  }

  /**
   * Cancels an accepted booking.
   *
   * Only clients and trainers who are part of the booking can cancel it.
   * The booking must be in ACCEPTED status.
   * If a client cancels less than 12 hours before the session starts,
   * they will be banned from booking with that trainer for 7 days.
   *
   * @param bookingId - The UUID of the booking to cancel
   * @param userId - The UUID of the authenticated user (from JWT token)
   * @returns The updated booking with CANCELLED status
   * @throws NotFoundException if the booking is not found or doesn't belong to the user
   * @throws ForbiddenException if the user is not authorized to cancel the booking
   * @throws ConflictException if the booking is not in ACCEPTED status
   */
  async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    try {
      // Step 1: Find the booking by ID
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      // Step 2: Check if booking exists
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      // Step 3: Verify ownership - user must be either client or trainer of the booking
      // Using 404 to not reveal existence of bookings belonging to other users
      if (booking.clientId !== userId && booking.trainerId !== userId) {
        throw new NotFoundException("Booking not found");
      }

      // Step 4: Verify booking is in ACCEPTED status
      if (booking.status !== BookingStatus.ACCEPTED) {
        throw new ConflictException("Booking is not in ACCEPTED status");
      }

      // Step 5: Check if this is a late cancellation by client (less than 12 hours before start)
      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const isLateCancellation = booking.clientId === userId && booking.startTime <= twelveHoursFromNow;

      // Step 6: Update booking status to CANCELLED
      booking.status = BookingStatus.CANCELLED;
      booking.updatedAt = new Date();

      // Step 7: Save the updated booking
      const updatedBooking = await this.bookingRepository.save(booking);

      // Step 8: Create booking ban if it's a late cancellation by client
      if (isLateCancellation) {
        // 7 days from now
        const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        await this.bookingBansService.create({
          clientId: booking.clientId,
          trainerId: booking.trainerId,
          bannedUntil: bannedUntil,
        });

        this.logger.log(
          `Late cancellation penalty applied: Client ${booking.clientId} banned from trainer ${booking.trainerId} until ${bannedUntil.toISOString()}`
        );
      }

      this.logger.log(
        `Booking ${bookingId} cancelled by user ${userId}. Status: CANCELLED. ${
          isLateCancellation ? "Late cancellation penalty applied." : ""
        }`
      );

      return updatedBooking;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to cancel booking ${bookingId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to cancel booking. Please try again later.");
    }
  }

  /**
   * Retrieves detailed information for a single booking by ID.
   *
   * Only the client or trainer associated with the booking can access its details.
   * The method loads relations (client, trainer, service) to provide enhanced context.
   *
   * @param bookingId - The UUID of the booking to retrieve
   * @param currentUserId - The UUID of the authenticated user (from JWT token)
   * @returns Detailed booking information as BookingDetailsResponseDto
   * @throws NotFoundException if the booking is not found or user doesn't have access
   * @throws ForbiddenException if the user is not authorized to view this booking
   */
  async getBookingById(bookingId: string, currentUserId: string): Promise<BookingDetailsResponseDto> {
    try {
      // Step 1: Find the booking with all necessary relations
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ["client", "trainer", "service"],
      });

      // Step 2: Check if booking exists
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }

      // Step 3: Check permissions - user must be either client or trainer
      if (booking.clientId !== currentUserId && booking.trainerId !== currentUserId) {
        throw new ForbiddenException("Access denied to this booking");
      }

      // Step 4: Map entity to response DTO
      const responseDto = mapBookingToDetailsResponseDto(booking);

      this.logger.log(`Booking ${bookingId} details retrieved for user ${currentUserId}`);

      return responseDto;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      // Log and wrap unexpected errors
      this.logger.error(`Failed to retrieve booking ${bookingId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve booking details. Please try again later.");
    }
  }
}
