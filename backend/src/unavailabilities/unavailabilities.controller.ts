import { Controller, Post, Get, Patch, Delete, Body, Query, Param, HttpCode, HttpStatus, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UnavailabilitiesService } from "./unavailabilities.service";
import { CreateUnavailabilityDto } from "./dto/create-unavailability.dto";
import { UpdateUnavailabilityDto } from "./dto/update-unavailability.dto";
import { UnavailabilityResponseDto } from "./dto/unavailability-response.dto";
import { GetUnavailabilitiesQueryDto } from "./dto/get-unavailabilities-query.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUser } from "../common/decorators/get-user.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import { User } from "../users/entities/user.entity";

/**
 * Controller for managing trainer unavailability periods.
 *
 * Provides endpoints for trainers to manage their unavailable time slots.
 * Protected with JwtAuthGuard and RolesGuard - only trainers can access.
 */
@ApiTags("unavailabilities")
@Controller("unavailabilities")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnavailabilitiesController {
  constructor(private readonly unavailabilitiesService: UnavailabilitiesService) {}

  /**
   * Retrieves all unavailability periods for the authenticated trainer.
   *
   * GET /unavailabilities
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer ID is automatically extracted from the JWT token.
   * Supports optional date range filtering via query parameters.
   *
   * @param user - The authenticated user (from JWT token)
   * @param query - Optional date range filters (from, to)
   * @returns Array of unavailability periods
   */
  @Get()
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all unavailability periods for the authenticated trainer",
    description:
      "Retrieves all unavailability periods for the authenticated trainer. " +
      "Supports optional date range filtering using 'from' and 'to' query parameters. " +
      "When both parameters are provided, returns only unavailabilities that overlap with the specified range. " +
      "The trainer ID is automatically extracted from the JWT token. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiQuery({
    name: "from",
    required: false,
    type: String,
    description: "Start date for filtering (ISO8601 format)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "to",
    required: false,
    type: String,
    description: "End date for filtering (ISO8601 format)",
    example: "2024-01-31T23:59:59.999Z",
  })
  @ApiOkResponse({
    description: "List of unavailability periods retrieved successfully",
    type: [UnavailabilityResponseDto],
    example: [
      {
        id: "c1d2e3f4-5678-90ab-cdef-1234567890ab",
        startTime: "2024-01-10T09:00:00.000Z",
        endTime: "2024-01-10T11:00:00.000Z",
        createdAt: "2023-12-01T10:00:00.000Z",
      },
      {
        id: "a1b2c3d4-5678-90ab-cdef-0987654321ba",
        startTime: "2024-01-15T14:00:00.000Z",
        endTime: "2024-01-15T16:00:00.000Z",
        createdAt: "2023-12-05T12:00:00.000Z",
      },
    ],
  })
  @ApiBadRequestResponse({
    description: "Invalid date format in query parameters",
    example: {
      statusCode: 400,
      message: ["from must be a valid ISO 8601 date string"],
      error: "Bad Request",
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have TRAINER role",
    example: {
      statusCode: 403,
      message: "Access denied. Required roles: TRAINER",
      error: "Forbidden",
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected server error",
    example: {
      statusCode: 500,
      message: "Failed to retrieve unavailabilities. Please try again later.",
      error: "Internal Server Error",
    },
  })
  async findAll(
    @GetUser() user: User,
    @Query() query: GetUnavailabilitiesQueryDto
  ): Promise<UnavailabilityResponseDto[]> {
    return this.unavailabilitiesService.findAll(user.id, query);
  }

  /**
   * Retrieves a single unavailability period by ID for the authenticated trainer.
   *
   * GET /unavailabilities/:id
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer can only access their own unavailability periods (IDOR protection).
   * Typically used to fetch details before editing or deleting.
   *
   * @param id - UUID of the unavailability to retrieve
   * @param user - The authenticated user (from JWT token)
   * @returns The unavailability period details
   */
  @Get(":id")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a single unavailability period by ID",
    description:
      "Retrieves detailed information about a specific unavailability period for the authenticated trainer. " +
      "The trainer can only access their own unavailability periods (IDOR protection). " +
      "This endpoint is typically used to fetch details before editing or deleting. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the unavailability period to retrieve",
    type: String,
    example: "c1d2e3f4-5678-90ab-cdef-1234567890ab",
  })
  @ApiOkResponse({
    description: "Unavailability period retrieved successfully",
    type: UnavailabilityResponseDto,
    example: {
      id: "c1d2e3f4-5678-90ab-cdef-1234567890ab",
      startTime: "2024-01-10T09:00:00.000Z",
      endTime: "2024-01-10T11:00:00.000Z",
      createdAt: "2023-12-01T10:00:00.000Z",
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format",
    example: {
      statusCode: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have TRAINER role",
    example: {
      statusCode: 403,
      message: "Access denied. Required roles: TRAINER",
      error: "Forbidden",
    },
  })
  @ApiNotFoundResponse({
    description: "Unavailability not found or access denied (IDOR protection)",
    example: {
      statusCode: 404,
      message: "Unavailability not found or access denied",
      error: "Not Found",
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected server error",
    example: {
      statusCode: 500,
      message: "Failed to retrieve unavailability. Please try again later.",
      error: "Internal Server Error",
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: User): Promise<UnavailabilityResponseDto> {
    return this.unavailabilitiesService.findOne(id, user.id);
  }

  /**
   * Creates a new unavailability period for the authenticated trainer.
   *
   * POST /unavailabilities
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer ID is automatically extracted from the JWT token.
   * The system validates that no conflicts exist with accepted bookings
   * or other unavailability periods.
   *
   * @param user - The authenticated user (from JWT token)
   * @param createDto - The unavailability creation data
   * @returns The newly created unavailability period
   */
  @Post()
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new unavailability period",
    description:
      "Creates a new unavailability period for the authenticated trainer. " +
      "The system validates that the start time is before the end time, " +
      "and that no conflicts exist with accepted bookings or other unavailability periods. " +
      "The trainer ID is automatically extracted from the JWT token. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiBody({
    type: CreateUnavailabilityDto,
    description: "Unavailability period data",
    examples: {
      weekendOff: {
        summary: "Weekend unavailability",
        value: {
          startTime: "2023-12-24T09:00:00.000Z",
          endTime: "2023-12-26T17:00:00.000Z",
        },
      },
      vacation: {
        summary: "Vacation period",
        value: {
          startTime: "2024-01-01T00:00:00.000Z",
          endTime: "2024-01-07T23:59:59.000Z",
        },
      },
      lunchBreak: {
        summary: "Daily lunch break",
        value: {
          startTime: "2023-12-20T12:00:00.000Z",
          endTime: "2023-12-20T13:00:00.000Z",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Unavailability period created successfully",
    type: UnavailabilityResponseDto,
    example: {
      id: "abc-123-uuid",
      startTime: "2023-12-24T09:00:00.000Z",
      endTime: "2023-12-26T17:00:00.000Z",
      trainerId: "trainer-uuid",
      createdAt: "2023-12-20T10:00:00.000Z",
      updatedAt: "2023-12-20T10:00:00.000Z",
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid request data or start time is not before end time",
    example: {
      statusCode: 400,
      message: "Start time must be before end time",
      error: "Bad Request",
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have TRAINER role",
    example: {
      statusCode: 403,
      message: "Access denied. Required roles: TRAINER",
      error: "Forbidden",
    },
  })
  @ApiConflictResponse({
    description: "Time slot conflicts with existing unavailability or accepted booking",
    example: {
      statusCode: 409,
      message: "Time slot conflicts with an accepted booking",
      error: "Conflict",
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected server error",
    example: {
      statusCode: 500,
      message: "Failed to create unavailability. Please try again later.",
      error: "Internal Server Error",
    },
  })
  async create(@GetUser() user: User, @Body() createDto: CreateUnavailabilityDto): Promise<UnavailabilityResponseDto> {
    return this.unavailabilitiesService.create(user.id, createDto);
  }

  /**
   * Updates an existing unavailability period for the authenticated trainer.
   *
   * PATCH /unavailabilities/:id
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer can only update their own unavailability periods (IDOR protection).
   * The system validates that no conflicts exist with accepted bookings
   * or other unavailability periods (excluding the current record being updated).
   *
   * @param id - UUID of the unavailability to update
   * @param user - The authenticated user (from JWT token)
   * @param updateDto - The unavailability update data (optional fields)
   * @returns The updated unavailability period
   */
  @Patch(":id")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update an existing unavailability period",
    description:
      "Updates an existing unavailability period for the authenticated trainer. " +
      "All fields in the request body are optional - only provided fields will be updated. " +
      "The system validates that the start time is before the end time, " +
      "and that no conflicts exist with accepted bookings or other unavailability periods. " +
      "The trainer can only update their own unavailability periods (IDOR protection). " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the unavailability period to update",
    type: String,
    example: "abc-123-uuid",
  })
  @ApiBody({
    type: UpdateUnavailabilityDto,
    description: "Updated unavailability period data (all fields optional)",
    examples: {
      updateBothTimes: {
        summary: "Update both start and end times",
        value: {
          startTime: "2023-12-24T10:00:00.000Z",
          endTime: "2023-12-26T18:00:00.000Z",
        },
      },
      updateStartOnly: {
        summary: "Update only start time",
        value: {
          startTime: "2023-12-24T11:00:00.000Z",
        },
      },
      updateEndOnly: {
        summary: "Update only end time",
        value: {
          endTime: "2023-12-26T16:00:00.000Z",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Unavailability period updated successfully",
    type: UnavailabilityResponseDto,
    example: {
      id: "abc-123-uuid",
      startTime: "2023-12-24T10:00:00.000Z",
      endTime: "2023-12-26T18:00:00.000Z",
      trainerId: "trainer-uuid",
      createdAt: "2023-12-20T10:00:00.000Z",
      updatedAt: "2023-12-22T15:30:00.000Z",
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid request data or start time is not before end time",
    example: {
      statusCode: 400,
      message: "Start time must be before end time",
      error: "Bad Request",
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have TRAINER role",
    example: {
      statusCode: 403,
      message: "Access denied. Required roles: TRAINER",
      error: "Forbidden",
    },
  })
  @ApiNotFoundResponse({
    description: "Unavailability not found or access denied (IDOR protection)",
    example: {
      statusCode: 404,
      message: "Unavailability not found or access denied",
      error: "Not Found",
    },
  })
  @ApiConflictResponse({
    description: "Time slot conflicts with existing unavailability or accepted booking",
    example: {
      statusCode: 409,
      message: "Time slot conflicts with an accepted booking",
      error: "Conflict",
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected server error",
    example: {
      statusCode: 500,
      message: "Failed to update unavailability. Please try again later.",
      error: "Internal Server Error",
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() updateDto: UpdateUnavailabilityDto
  ): Promise<UnavailabilityResponseDto> {
    return this.unavailabilitiesService.update(id, user.id, updateDto);
  }

  /**
   * Deletes an existing unavailability period for the authenticated trainer.
   *
   * DELETE /unavailabilities/:id
   *
   * This endpoint is restricted to users with TRAINER role.
   * The trainer can only delete their own unavailability periods (IDOR protection).
   * After deletion, the time slot becomes available for bookings again.
   *
   * @param id - UUID of the unavailability to delete
   * @param user - The authenticated user (from JWT token)
   * @returns No content (204)
   */
  @Delete(":id")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete an unavailability period",
    description:
      "Deletes an existing unavailability period for the authenticated trainer. " +
      "The trainer can only delete their own unavailability periods (IDOR protection). " +
      "After deletion, the time slot becomes available for bookings again. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: TRAINER role.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the unavailability period to delete",
    type: String,
    example: "abc-123-uuid",
  })
  @ApiNoContentResponse({
    description: "Unavailability period deleted successfully",
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format",
    example: {
      statusCode: 400,
      message: "Validation failed (uuid is expected)",
      error: "Bad Request",
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    example: {
      statusCode: 401,
      message: "Unauthorized",
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have TRAINER role",
    example: {
      statusCode: 403,
      message: "Access denied. Required roles: TRAINER",
      error: "Forbidden",
    },
  })
  @ApiNotFoundResponse({
    description: "Unavailability not found or access denied (IDOR protection)",
    example: {
      statusCode: 404,
      message: "Unavailability not found or access denied",
      error: "Not Found",
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Unexpected server error",
    example: {
      statusCode: 500,
      message: "Failed to delete unavailability. Please try again later.",
      error: "Internal Server Error",
    },
  })
  async remove(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: User): Promise<void> {
    return this.unavailabilitiesService.remove(id, user.id);
  }
}
