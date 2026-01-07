import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { GetBookingsQueryDto, UserBookingRole } from "./dto/get-bookings-query.dto";
import { PaginatedBookingsResponseDto, BookingDetailsResponseDto } from "./dto/paginated-bookings-response.dto";
import { Booking } from "./entities/booking.entity";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { AuthUserInterface } from "../common/interfaces/auth-user.interface";
import { BookingStatus } from "./interfaces/booking-status.enum";

/**
 * Controller for managing bookings.
 *
 * Provides endpoints for creating and managing booking requests.
 * Protected with JwtAuthGuard and RolesGuard.
 */
@ApiTags("bookings")
@Controller("bookings")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Creates a new booking request.
   *
   * POST /bookings
   *
   * This endpoint is restricted to users with CLIENT role.
   * The client ID is automatically extracted from the JWT token.
   *
   * @param user - The authenticated user (from JWT token)
   * @param createBookingDto - The booking creation data
   * @returns The newly created booking
   */
  @Post()
  @Roles(UserRole.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new booking request",
    description:
      "Creates a new booking request for a service with a trainer. " +
      "The system validates that the requested time slot is available, " +
      "the service belongs to the specified trainer, and the client is not banned. " +
      "The client ID is automatically extracted from the JWT token. " +
      "New bookings are created with PENDING status. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: CLIENT role.",
  })
  @ApiBody({
    type: CreateBookingDto,
    description: "Booking creation data",
    examples: {
      basicBooking: {
        summary: "Basic booking request",
        value: {
          trainerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          serviceId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
          startTime: "2023-11-15T14:00:00Z",
        },
      },
      morningSession: {
        summary: "Morning training session",
        value: {
          trainerId: "c3d4e5f6-g7h8-9012-3456-789012cdef01",
          serviceId: "d4e5f6g7-h8i9-0123-4567-890123def012",
          startTime: "2023-11-16T09:00:00Z",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Booking created successfully",
    type: Booking,
    schema: {
      example: {
        id: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
        clientId: "f6g7h8i9-j0k1-2345-6789-012345f01234",
        trainerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        serviceId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
        startTime: "2023-11-15T14:00:00.000Z",
        endTime: "2023-11-15T15:00:00.000Z",
        status: "PENDING",
        createdAt: "2023-11-10T10:00:00.000Z",
        updatedAt: "2023-11-10T10:00:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data, time slot not available, service doesn't belong to trainer, or time in the past",
    schema: {
      examples: {
        validation: {
          statusCode: 400,
          message: ["trainerId must be a UUID", "startTime must be a valid ISO 8601 date string"],
          error: "Bad Request",
        },
        timeSlotNotAvailable: {
          statusCode: 400,
          message: "The selected time slot is not available.",
          error: "Bad Request",
        },
        serviceNotBelongsToTrainer: {
          statusCode: 400,
          message: "Service does not belong to the specified trainer",
          error: "Bad Request",
        },
        pastTime: {
          statusCode: 400,
          message: "Cannot book a time in the past.",
          error: "Bad Request",
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - user does not have CLIENT role or is banned from booking",
    schema: {
      examples: {
        roleRequired: {
          statusCode: 403,
          message: "Access denied. Required roles: CLIENT",
          error: "Forbidden",
        },
        banned: {
          statusCode: 403,
          message: "You are currently banned from making bookings.",
          error: "Forbidden",
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service or trainer not found",
    schema: {
      examples: {
        serviceNotFound: {
          statusCode: 404,
          message: "Service not found",
          error: "Not Found",
        },
        trainerNotFound: {
          statusCode: 404,
          message: "Trainer not found",
          error: "Not Found",
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to create booking. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async create(@GetUser() user: AuthUserInterface, @Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(user.userId, createBookingDto);
  }

  /**
   * Retrieves a paginated list of bookings for the authenticated user.
   *
   * GET /bookings
   *
   * This endpoint is accessible to both CLIENT and TRAINER roles.
   * The user ID is automatically extracted from the JWT token.
   * Supports filtering by status and role perspective, and pagination.
   *
   * @param user - The authenticated user (from JWT token)
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of bookings
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get user bookings",
    description:
      "Retrieves a paginated list of bookings for the authenticated user. " +
      "Users can filter by booking status and specify their role perspective " +
      "(client or trainer) if they have both roles. " +
      "**Authentication required**: Bearer JWT token.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: BookingStatus,
    description: "Filter bookings by status",
  })
  @ApiQuery({
    name: "role",
    required: false,
    enum: UserBookingRole,
    description: "Specify the role perspective (client or trainer)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10)",
  })
  @ApiOkResponse({
    description: "Successfully retrieved bookings",
    type: PaginatedBookingsResponseDto,
    schema: {
      example: {
        data: [
          {
            id: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
            startTime: "2025-11-26T10:00:00.000Z",
            endTime: "2025-11-26T11:00:00.000Z",
            status: "ACCEPTED",
            client: { id: "client-uuid", name: "Jan Kowalski" },
            trainer: { id: "trainer-uuid", name: "Anna Nowak" },
            service: { id: "service-uuid", name: "Trening personalny" },
          },
        ],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid query parameters",
    schema: {
      example: {
        statusCode: 400,
        message: ["status must be one of the following values: PENDING, ACCEPTED, REJECTED, CANCELLED"],
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve bookings. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findAll(
    @GetUser() user: AuthUserInterface,
    @Query() query: GetBookingsQueryDto
  ): Promise<PaginatedBookingsResponseDto> {
    return this.bookingsService.findUserBookings(user.userId, query);
  }

  /**
   * Retrieves detailed information for a single booking.
   *
   * GET /bookings/:id
   *
   * This endpoint is accessible to both CLIENT and TRAINER roles.
   * Only the client or trainer associated with the booking can access its details.
   * The user ID is automatically extracted from the JWT token.
   *
   * @param user - The authenticated user (from JWT token)
   * @param id - The UUID of the booking to retrieve
   * @returns Detailed booking information
   */
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get booking details",
    description:
      "Retrieves detailed information for a specific booking. " +
      "Only the client or trainer associated with the booking can access its details. " +
      "**Authentication required**: Bearer JWT token.",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "UUID of the booking to retrieve",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @ApiOkResponse({
    description: "Booking details retrieved successfully",
    type: BookingDetailsResponseDto,
    schema: {
      example: {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        clientId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
        trainerId: "c3d4e5f6-g7h8-9012-3456-789012cdef01",
        serviceId: "d4e5f6g7-h8i9-0123-4567-890123def012",
        startTime: "2025-12-03T10:00:00Z",
        endTime: "2025-12-03T11:00:00Z",
        status: "PENDING",
        reminderSentAt: null,
        createdAt: "2025-12-02T12:00:00Z",
        updatedAt: "2025-12-02T12:00:00Z",
        clientName: "Jan Kowalski",
        trainerName: "Anna Nowak",
        servicePrice: 150.0,
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid booking ID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - user is not part of the booking",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied to this booking",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking not found or does not belong to the user",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking not found",
        error: "Not Found",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve booking details. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findOne(
    @GetUser() user: AuthUserInterface,
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<BookingDetailsResponseDto> {
    return this.bookingsService.getBookingById(id, user.userId);
  }

  /**
   * Approves a pending booking.
   *
   * POST /bookings/:id/approve
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer can only approve bookings that belong to them.
   * The booking must be in PENDING status to be approved.
   *
   * @param user - The authenticated trainer (from JWT token)
   * @param id - The UUID of the booking to approve
   * @returns The updated booking with ACCEPTED status
   */
  @Post(":id/approve")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Approve a pending booking",
    description:
      "Approves a pending booking request. " +
      "Only trainers can approve bookings that belong to them. " +
      "The booking must be in PENDING status. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "UUID of the booking to approve",
    example: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
  })
  @ApiOkResponse({
    description: "Booking approved successfully",
    type: Booking,
    schema: {
      example: {
        id: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
        clientId: "f6g7h8i9-j0k1-2345-6789-012345f01234",
        trainerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        serviceId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
        startTime: "2023-11-15T14:00:00.000Z",
        endTime: "2023-11-15T15:00:00.000Z",
        status: "ACCEPTED",
        createdAt: "2023-11-10T10:00:00.000Z",
        updatedAt: "2023-11-10T12:30:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid booking ID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - user does not have TRAINER role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: TRAINER",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking not found or does not belong to the trainer",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Booking is not in PENDING status",
    schema: {
      example: {
        statusCode: 409,
        message: "Booking is not in PENDING status",
        error: "Conflict",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to approve booking. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async approve(@GetUser() user: AuthUserInterface, @Param("id", ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.approveBooking(id, user.userId);
  }

  /**
   * Rejects a pending booking.
   *
   * POST /bookings/:id/reject
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer can only reject bookings that belong to them.
   * The booking must be in PENDING status to be rejected.
   *
   * @param user - The authenticated trainer (from JWT token)
   * @param id - The UUID of the booking to reject
   * @returns The updated booking with REJECTED status
   */
  @Post(":id/reject")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reject a pending booking",
    description:
      "Rejects a pending booking request. " +
      "Only trainers can reject bookings that belong to them. " +
      "The booking must be in PENDING status. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "UUID of the booking to reject",
    example: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
  })
  @ApiOkResponse({
    description: "Booking rejected successfully",
    type: Booking,
    schema: {
      example: {
        id: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
        clientId: "f6g7h8i9-j0k1-2345-6789-012345f01234",
        trainerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        serviceId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
        startTime: "2023-11-15T14:00:00.000Z",
        endTime: "2023-11-15T15:00:00.000Z",
        status: "REJECTED",
        createdAt: "2023-11-10T10:00:00.000Z",
        updatedAt: "2023-11-10T12:30:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid booking ID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - user does not have TRAINER role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: TRAINER",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking not found or does not belong to the trainer",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Booking is not in PENDING status",
    schema: {
      example: {
        statusCode: 409,
        message: "Booking is not in PENDING status",
        error: "Conflict",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to reject booking. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async reject(@GetUser() user: AuthUserInterface, @Param("id", ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.rejectBooking(id, user.userId);
  }

  /**
   * Cancels an accepted booking.
   *
   * POST /bookings/:id/cancel
   *
   * This endpoint allows authenticated clients and trainers to cancel accepted bookings.
   * If a client cancels less than 12 hours before the session, they will be banned
   * from booking with that trainer for 7 days.
   *
   * @param user - The authenticated user (from JWT token)
   * @param id - The UUID of the booking to cancel
   * @returns The updated booking with CANCELLED status
   */
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel an accepted booking",
    description:
      "Cancels an accepted booking request. " +
      "Both clients and trainers can cancel bookings they are part of. " +
      "The booking must be in ACCEPTED status. " +
      "If a client cancels less than 12 hours before the session, " +
      "they will be banned from booking with that trainer for 7 days. " +
      "**Authentication required**: Bearer JWT token.",
  })
  @ApiParam({
    name: "id",
    type: String,
    description: "UUID of the booking to cancel",
    example: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
  })
  @ApiOkResponse({
    description: "Booking cancelled successfully",
    type: Booking,
    schema: {
      example: {
        id: "e5f6g7h8-i9j0-1234-5678-901234ef0123",
        clientId: "f6g7h8i9-j0k1-2345-6789-012345f01234",
        trainerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        serviceId: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
        startTime: "2023-11-15T14:00:00.000Z",
        endTime: "2023-11-15T15:00:00.000Z",
        status: "CANCELLED",
        createdAt: "2023-11-10T10:00:00.000Z",
        updatedAt: "2023-11-10T12:30:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid booking ID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Authentication required - missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - user is not part of the booking or booking is not in ACCEPTED status",
    schema: {
      example: {
        statusCode: 403,
        message: "You are not authorized to cancel this booking",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking not found or does not belong to the user",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Booking is not in ACCEPTED status",
    schema: {
      example: {
        statusCode: 409,
        message: "Booking is not in ACCEPTED status",
        error: "Conflict",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to cancel booking. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async cancel(@GetUser() user: AuthUserInterface, @Param("id", ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookingsService.cancelBooking(id, user.userId);
  }
}
