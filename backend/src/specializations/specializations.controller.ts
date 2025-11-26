import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiNoContentResponse,
} from "@nestjs/swagger";
import { SpecializationsService } from "./specializations.service";
import { CreateSpecializationDto } from "./dto/create-specialization.dto";
import { UpdateSpecializationDto } from "./dto/update-specialization.dto";
import { SpecializationDto } from "./dto/specialization.dto";
import { Specialization } from "./entities/specialization.entity";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";

/**
 * Controller for managing specializations (dictionary module)
 *
 * Provides endpoints for CRUD operations on specializations.
 * Specializations are used to categorize trainer expertise areas.
 *
 * Protected with JwtAuthGuard and RolesGuard.
 * POST and PATCH operations require ADMIN role.
 */
@ApiTags("specializations")
@Controller("specializations")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SpecializationsController {
  constructor(private readonly specializationsService: SpecializationsService) {}

  /**
   * Creates a new specialization
   *
   * POST /specializations
   *
   * This endpoint is restricted to users with ADMIN role.
   * Validates that the specialization name is unique.
   *
   * @param createSpecializationDto - Specialization creation data
   * @returns The newly created specialization
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new specialization",
    description:
      "Creates a new specialization in the system. This is an administrative operation " +
      "that allows defining new categories of trainer expertise. " +
      "The specialization name must be unique and at most 255 characters. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiBody({
    type: CreateSpecializationDto,
    description: "Specialization creation data",
    examples: {
      strengthTraining: {
        summary: "Strength training",
        value: {
          name: "Trening siĹ‚owy",
        },
      },
      cardioTraining: {
        summary: "Cardio training",
        value: {
          name: "Trening cardio",
        },
      },
      yoga: {
        summary: "Yoga",
        value: {
          name: "Joga",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Specialization created successfully",
    type: Specialization,
    schema: {
      example: {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        name: "Trening siĹ‚owy",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data - validation failed",
    schema: {
      example: {
        statusCode: 400,
        message: ["name should not be empty", "name must be a string"],
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
    description: "Access denied - user does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiConflictResponse({
    description: "Specialization with this name already exists",
    schema: {
      example: {
        statusCode: 409,
        message: "Specialization with this name already exists",
        error: "Conflict",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to create specialization. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async create(@Body() createSpecializationDto: CreateSpecializationDto): Promise<Specialization> {
    return this.specializationsService.create(createSpecializationDto);
  }

  /**
   * Retrieves all specializations
   *
   * GET /specializations
   *
   * This is a public endpoint that does not require authentication.
   * Returns a list of all available specializations in the system.
   *
   * @returns Array of all specializations with their basic information
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: "Get all specializations",
    description:
      "Retrieves a list of all available specializations in the system. " +
      "This is a public endpoint used to fetch dictionary data for frontend integration. " +
      "Returns an array of specializations sorted by name. " +
      "**Authentication**: Not required.",
  })
  @ApiOkResponse({
    description: "Returns an array of all specializations",
    type: [SpecializationDto],
    schema: {
      example: [
        {
          id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          name: "Trening siĹ‚owy",
        },
        {
          id: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
          name: "Trening cardio",
        },
        {
          id: "c3d4e5f6-g7h8-9012-3456-789012cdef01",
          name: "Joga",
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve specializations. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findAll(): Promise<SpecializationDto[]> {
    return this.specializationsService.findAll();
  }

  /**
   * Retrieves a single specialization by its ID
   *
   * GET /specializations/:id
   *
   * This is a public endpoint that does not require authentication.
   * Returns the specialization data if found, or 404 if not found.
   *
   * @param id - The UUID of the specialization to retrieve
   * @returns The specialization data
   */
  @Get(":id")
  @Public()
  @ApiOperation({
    summary: "Get a single specialization by ID",
    description:
      "Retrieves a single specialization from the system by its unique identifier. " +
      "This is a public endpoint used to fetch dictionary data. " +
      "**Authentication**: Not required.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Unique identifier of the specialization",
    example: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
  })
  @ApiOkResponse({
    description: "Returns the specialization",
    type: SpecializationDto,
    schema: {
      example: {
        id: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
        name: "Trening siĹ‚owy",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format - must be a valid UUID",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Specialization not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Specialization not found",
        error: "Not Found",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve specialization. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<SpecializationDto> {
    return this.specializationsService.findOne(id);
  }

  /**
   * Updates an existing specialization
   *
   * PATCH /specializations/:id
   *
   * This endpoint is restricted to users with ADMIN role.
   * Validates that the specialization exists and that the new name is unique.
   *
   * @param id - The UUID of the specialization to update
   * @param updateSpecializationDto - Specialization update data
   * @returns The updated specialization
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update an existing specialization",
    description:
      "Updates the name of an existing specialization in the system. " +
      "This is an administrative operation that allows modifying categories of trainer expertise. " +
      "The new specialization name must be unique and at most 255 characters. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Unique identifier of the specialization to update",
    example: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
  })
  @ApiBody({
    type: UpdateSpecializationDto,
    description: "Specialization update data",
    examples: {
      strengthTraining: {
        summary: "Update to strength training",
        value: {
          name: "Trening siĹ‚owy",
        },
      },
      cardioTraining: {
        summary: "Update to cardio training",
        value: {
          name: "Trening cardio",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Specialization updated successfully",
    type: SpecializationDto,
    schema: {
      example: {
        id: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
        name: "Trening siĹ‚owy",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid input data - validation failed (invalid UUID or empty name)",
    schema: {
      example: {
        statusCode: 400,
        message: ["name should not be empty", "name must be a string"],
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
    description: "Access denied - user does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Specialization not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Specialization with id e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Specialization with this name already exists",
    schema: {
      example: {
        statusCode: 409,
        message: "Specialization with name 'Trening siĹ‚owy' already exists",
        error: "Conflict",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to update specialization. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSpecializationDto: UpdateSpecializationDto
  ): Promise<SpecializationDto> {
    return this.specializationsService.update(id, updateSpecializationDto);
  }

  /**
   * Deletes an existing specialization
   *
   * DELETE /specializations/:id
   *
   * This endpoint is restricted to users with ADMIN role.
   * Validates that the specialization exists and is not in use by any trainer profiles.
   * Performs hard delete operation.
   *
   * @param id - The UUID of the specialization to delete
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a specialization",
    description:
      "Deletes an existing specialization from the system. This is an administrative operation " +
      "that allows removing categories of trainer expertise. The specialization must not be " +
      "associated with any trainer profiles. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "Unique identifier of the specialization to delete",
    example: "e8e1f3b3-f3b3-4f3b-8f3b-3b3f3b3f3b3f",
  })
  @ApiNoContentResponse({
    description: "Specialization deleted successfully",
  })
  @ApiBadRequestResponse({
    description: "Invalid ID format - must be a valid UUID",
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
    description: "Access denied or specialization is in use by trainer profiles",
    schema: {
      example: {
        statusCode: 403,
        message: "Specialization is currently in use by trainer profiles and cannot be deleted",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Specialization not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Specialization not found",
        error: "Not Found",
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to delete specialization. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.specializationsService.deleteSpecialization(id);
  }
}
