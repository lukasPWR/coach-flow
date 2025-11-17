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
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiParam,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { ServiceTypesService } from "./service-types.service";
import { CreateServiceTypeDto } from "./dto/create-service-type.dto";
import { UpdateServiceTypeDto } from "./dto/update-service-type.dto";
import { ServiceType } from "./entities/service-type.entity";
import { ServiceTypeDto } from "./dto/service-type.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";

/**
 * Controller for managing service types (dictionary module)
 *
 * Provides endpoints for CRUD operations on service types.
 * Service types are used to categorize services offered by trainers.
 *
 * Protected with JwtAuthGuard and RolesGuard.
 * POST/PATCH/DELETE operations require ADMIN role.
 * GET operations are publicly accessible.
 */
@ApiTags("service-types")
@Controller("service-types")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  /**
   * Creates a new service type
   *
   * POST /service-types
   *
   * This endpoint is restricted to users with ADMIN role.
   * Validates that the service type name is unique.
   *
   * @param createServiceTypeDto - Service type creation data
   * @returns The newly created service type
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new service type",
    description:
      "Creates a new service type in the system. This is an administrative operation " +
      "that allows defining new categories of services that trainers can offer. " +
      "The service type name must be unique. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiBody({
    type: CreateServiceTypeDto,
    description: "Service type creation data",
    examples: {
      personalTraining: {
        summary: "Personal training",
        value: {
          name: "Trening personalny",
        },
      },
      groupTraining: {
        summary: "Group training",
        value: {
          name: "Trening grupowy",
        },
      },
      nutritionConsultation: {
        summary: "Nutrition consultation",
        value: {
          name: "Konsultacja żywieniowa",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Service type successfully created",
    type: ServiceType,
    schema: {
      example: {
        id: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
        name: "Trening personalny",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation error - invalid input data (e.g., missing name, empty string)",
    schema: {
      example: {
        statusCode: 400,
        message: ["name should not be empty", "name must be a string"],
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Forbidden resource",
        error: "Forbidden",
      },
    },
  })
  @ApiConflictResponse({
    description: "Service type with this name already exists",
    schema: {
      example: {
        statusCode: 409,
        message: "Service type with this name already exists",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to create service type. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async create(@Body() createServiceTypeDto: CreateServiceTypeDto): Promise<ServiceType> {
    return await this.serviceTypesService.create(createServiceTypeDto);
  }

  /**
   * Retrieves all service types
   *
   * GET /service-types
   *
   * This endpoint is publicly accessible and returns all available
   * service types in the system. Used for displaying service type
   * options in forms and dropdowns.
   *
   * @returns Array of all service types
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get all service types",
    description:
      "Retrieves a complete list of all available service types in the system. " +
      "Service types are used to categorize services offered by trainers. " +
      "This endpoint is publicly accessible and does not require authentication. " +
      "The response contains all service types as this is a dictionary endpoint " +
      "with a small number of records.",
  })
  @ApiResponse({
    status: 200,
    description: "List of all service types successfully retrieved",
    type: [ServiceTypeDto],
    schema: {
      example: [
        {
          id: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
          name: "Trening personalny",
        },
        {
          id: "d1e2f3a4-b5c6-7890-1234-567890abcdef",
          name: "Konsultacja dietetyczna",
        },
        {
          id: "e2f3a4b5-c6d7-8901-2345-67890abcdef0",
          name: "Trening grupowy",
        },
      ],
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error - database connection issue",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve service types. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findAll(): Promise<ServiceTypeDto[]> {
    return await this.serviceTypesService.findAll();
  }

  /**
   * Retrieves a single service type by ID
   *
   * GET /service-types/:id
   *
   * This endpoint is publicly accessible and returns a specific
   * service type identified by its UUID.
   *
   * @param id - UUID of the service type to retrieve
   * @returns The service type with the specified ID
   */
  @Get(":id")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a service type by ID",
    description:
      "Retrieves a single service type by its unique identifier (UUID). " +
      "This endpoint is publicly accessible and does not require authentication. " +
      "If the service type with the specified ID does not exist, a 404 error is returned.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the service type",
    example: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Service type successfully retrieved",
    type: ServiceTypeDto,
    schema: {
      example: {
        id: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
        name: "Trening personalny",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format provided in the id parameter",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service type with the specified ID does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Service type with id c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error - database connection issue",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to retrieve service type. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ServiceTypeDto> {
    return await this.serviceTypesService.findOne(id);
  }

  /**
   * Updates an existing service type
   *
   * PATCH /service-types/:id
   *
   * This endpoint is restricted to users with ADMIN role.
   * Allows partial updates of service type properties.
   * Validates that the new name (if provided) is unique.
   *
   * @param id - UUID of the service type to update
   * @param updateServiceTypeDto - Service type update data
   * @returns The updated service type
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update a service type",
    description:
      "Updates an existing service type in the system. This is an administrative operation " +
      "that allows modifying service type properties. Only provided fields will be updated. " +
      "If a new name is provided, it must be unique. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the service type to update",
    example: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
    type: String,
    format: "uuid",
  })
  @ApiBody({
    type: UpdateServiceTypeDto,
    description: "Service type update data (all fields are optional)",
    examples: {
      updateName: {
        summary: "Update service type name",
        value: {
          name: "Nowa nazwa typu usługi",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Service type successfully updated",
    type: ServiceType,
    schema: {
      example: {
        id: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
        name: "Zaktualizowana nazwa typu usługi",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation error - invalid input data (e.g., invalid UUID format, name too short/long)",
    schema: {
      example: {
        statusCode: 400,
        message: ["name must be longer than or equal to 3 characters"],
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Forbidden resource",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service type with the specified ID does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Service type with id c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Service type with the new name already exists",
    schema: {
      example: {
        statusCode: 409,
        message: "Service type with this name already exists",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to update service type. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateServiceTypeDto: UpdateServiceTypeDto
  ): Promise<ServiceType> {
    return await this.serviceTypesService.update(id, updateServiceTypeDto);
  }

  /**
   * Deletes a service type
   *
   * DELETE /service-types/:id
   *
   * This endpoint is restricted to users with ADMIN role.
   * Permanently removes a service type from the system.
   * The operation will fail if the service type is associated with any active services.
   *
   * @param id - UUID of the service type to delete
   * @returns No content (204) on success
   */
  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a service type",
    description:
      "Permanently deletes a service type from the system. This is an administrative operation " +
      "that removes a service type category. The operation will fail if the service type is " +
      "currently in use by any active services. " +
      "**Authentication required**: Bearer JWT token. " +
      "**Authorization required**: ADMIN role.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the service type to delete",
    example: "c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a",
    type: String,
    format: "uuid",
  })
  @ApiResponse({
    status: 204,
    description: "Service type successfully deleted (no content returned)",
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format provided in the id parameter",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "User does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Forbidden resource",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service type with the specified ID does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Service type with id c3e3e0b8-2a78-4f8e-a223-2f2f7c2b9a7a not found",
        error: "Not Found",
      },
    },
  })
  @ApiConflictResponse({
    description: "Service type is currently in use by active services and cannot be deleted",
    schema: {
      example: {
        statusCode: 409,
        message: "Cannot delete service type that is currently in use by services",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Failed to delete service type. Please try again later.",
        error: "Internal Server Error",
      },
    },
  })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.serviceTypesService.remove(id);
  }
}
