import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { BookingBansService } from "./booking-bans.service";
import { CreateBookingBanDto } from "./dto/create-booking-ban.dto";
import { UpdateBookingBanDto } from "./dto/update-booking-ban.dto";
import { BookingBanResponseDto } from "./dto/booking-ban-response.dto";
import { PaginatedBookingBansResponseDto } from "./dto/paginated-booking-bans-response.dto";
import { BookingBan } from "./entities/booking-ban.entity";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";

/**
 * Controller handling booking ban management.
 *
 * Restricted to ADMIN users.
 */
@ApiTags("booking-bans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("booking-bans")
export class BookingBansController {
  constructor(private readonly bookingBansService: BookingBansService) {}

  /**
   * Retrieves a paginated list of all booking bans.
   *
   * GET /booking-bans
   *
   * Only accessible by ADMIN users. Returns booking bans with client and trainer
   * information, paginated for efficient data handling.
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get all booking bans (paginated)",
    description:
      "Retrieves a paginated list of all booking bans in the system. " +
      "Each ban includes complete client and trainer information. " +
      "Requires ADMIN role.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (1-indexed)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of items per page (max 100)",
    example: 10,
  })
  @ApiOkResponse({
    description: "Booking bans retrieved successfully",
    type: PaginatedBookingBansResponseDto,
    schema: {
      example: {
        data: [
          {
            id: "c1d2e3f4-g5h6-7890-1234-567890abcdef",
            bannedUntil: "2024-01-01T00:00:00.000Z",
            client: {
              id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
              name: "Jan Kowalski",
              email: "jan.kowalski@example.com",
            },
            trainer: {
              id: "b1c2d3e4-f5g6-7890-1234-567890abcdef",
              name: "Anna Nowak",
              email: "anna.nowak@example.com",
            },
            createdAt: "2023-12-01T10:00:00.000Z",
          },
        ],
        meta: {
          totalItems: 1,
          itemsPerPage: 10,
          currentPage: 1,
          totalPages: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid pagination parameters",
    schema: {
      example: {
        statusCode: 400,
        message: ["page must be a positive integer", "limit must not be greater than 100"],
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - ADMIN role required",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedBookingBansResponseDto> {
    return this.bookingBansService.findAll(query);
  }

  /**
   * Creates or updates a booking ban for a client with a specific trainer.
   *
   * POST /booking-bans
   *
   * Only accessible by ADMIN users. If an active ban exists, it will be updated
   * with the new `bannedUntil` date; otherwise, a new ban is created.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create or update a booking ban",
    description:
      "Creates a booking ban preventing a client from booking with a trainer until a given date. " +
      "If an active ban already exists, it updates the existing ban with the new end date. " +
      "Requires ADMIN role.",
  })
  @ApiCreatedResponse({
    description: "Booking ban created or updated successfully",
    type: BookingBan,
    schema: {
      example: {
        id: "c1d2e3f4-g5h6-7890-1234-567890abcdef",
        clientId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        trainerId: "b1c2d3e4-f5g6-7890-1234-567890abcdef",
        bannedUntil: "2026-01-01T00:00:00.000Z",
        createdAt: "2025-12-06T10:00:00.000Z",
        updatedAt: "2025-12-06T10:00:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation failed or client/trainer not found, or bannedUntil not in future",
    schema: {
      examples: {
        validation: {
          statusCode: 400,
          message: ["clientId must be a UUID", "bannedUntil must be a valid ISO 8601 date string"],
          error: "Bad Request",
        },
        pastDate: {
          statusCode: 400,
          message: "bannedUntil must be a future date",
          error: "Bad Request",
        },
        clientMissing: {
          statusCode: 400,
          message: "Client not found",
          error: "Bad Request",
        },
        trainerMissing: {
          statusCode: 400,
          message: "Trainer not found",
          error: "Bad Request",
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - ADMIN role required",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  async create(@Body() createBookingBanDto: CreateBookingBanDto): Promise<BookingBan> {
    return this.bookingBansService.create(createBookingBanDto);
  }

  /**
   * Retrieves detailed information about a specific booking ban.
   *
   * GET /booking-bans/:id
   *
   * Only accessible by ADMIN users. Returns complete booking ban details
   * including client and trainer information.
   */
  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get booking ban by ID",
    description:
      "Retrieves detailed information about a specific booking ban, including " +
      "client and trainer details. Requires ADMIN role.",
  })
  @ApiOkResponse({
    description: "Booking ban details retrieved successfully",
    type: BookingBanResponseDto,
    schema: {
      example: {
        id: "c1d2e3f4-g5h6-7890-1234-567890abcdef",
        bannedUntil: "2024-01-01T00:00:00.000Z",
        client: {
          id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          name: "Jan Kowalski",
          email: "jan.kowalski@example.com",
        },
        trainer: {
          id: "b1c2d3e4-f5g6-7890-1234-567890abcdef",
          name: "Anna Nowak",
          email: "anna.nowak@example.com",
        },
        createdAt: "2023-12-01T10:00:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - ADMIN role required",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking ban not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking ban with ID c1d2e3f4-g5h6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<BookingBanResponseDto> {
    return this.bookingBansService.findOne(id);
  }

  /**
   * Updates an existing booking ban.
   *
   * PATCH /booking-bans/:id
   *
   * Only accessible by ADMIN users. Allows partial update of a booking ban,
   * primarily for extending or shortening the ban period.
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update a booking ban",
    description:
      "Partially updates an existing booking ban, typically to extend or shorten " +
      "the ban period by modifying the bannedUntil date. Requires ADMIN role.",
  })
  @ApiBody({
    type: UpdateBookingBanDto,
    description: "Fields to update (currently only bannedUntil)",
    examples: {
      extendBan: {
        summary: "Extend ban period",
        value: {
          bannedUntil: "2026-02-01T00:00:00.000Z",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Booking ban updated successfully",
    type: BookingBanResponseDto,
    schema: {
      example: {
        id: "c1d2e3f4-g5h6-7890-1234-567890abcdef",
        bannedUntil: "2026-02-01T00:00:00.000Z",
        client: {
          id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          name: "Jan Kowalski",
          email: "jan.kowalski@example.com",
        },
        trainer: {
          id: "b1c2d3e4-f5g6-7890-1234-567890abcdef",
          name: "Anna Nowak",
          email: "anna.nowak@example.com",
        },
        createdAt: "2023-12-01T10:00:00.000Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format or bannedUntil not in future",
    schema: {
      examples: {
        invalidUuid: {
          summary: "Invalid UUID",
          value: {
            statusCode: 400,
            message: "Validation failed (uuid is expected)",
            error: "Bad Request",
          },
        },
        pastDate: {
          summary: "Date in the past",
          value: {
            statusCode: 400,
            message: "bannedUntil must be a future date",
            error: "Bad Request",
          },
        },
        invalidDate: {
          summary: "Invalid date format",
          value: {
            statusCode: 400,
            message: "bannedUntil must be a valid date",
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - ADMIN role required",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking ban not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking ban with ID c1d2e3f4-g5h6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBookingBanDto: UpdateBookingBanDto
  ): Promise<BookingBanResponseDto> {
    return this.bookingBansService.update(id, updateBookingBanDto);
  }

  /**
   * Permanently deletes a booking ban from the system.
   *
   * DELETE /booking-bans/:id
   *
   * Only accessible by ADMIN users. This operation is permanent and cannot be undone.
   * Returns 204 No Content on success.
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a booking ban",
    description:
      "Permanently removes a booking ban from the system. This operation cannot be undone. Requires ADMIN role.",
  })
  @ApiNoContentResponse({
    description: "Booking ban successfully deleted (no content returned)",
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "Access denied - ADMIN role required",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Booking ban not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Booking ban with ID c1d2e3f4-g5h6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.bookingBansService.remove(id);
  }
}
