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
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceResponseDto } from "./dto/service-response.dto";
import { Service } from "./entities/service.entity";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "src/common/interfaces/request-app.interface";

@ApiTags("services")
@Controller("services")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Creates a new service
   *
   * POST /services
   *
   * @param createServiceDto - Service creation data
   * @returns The newly created service
   */
  @Post()
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a new service",
    description:
      "Creates a new service that can be offered by a trainer. " +
      "Requires valid trainerId and serviceTypeId. " +
      "This endpoint requires TRAINER role.",
  })
  @ApiBody({
    type: CreateServiceDto,
    description: "Service creation data",
    examples: {
      example1: {
        summary: "Standard training session",
        value: {
          serviceTypeId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          price: 150.0,
          durationMinutes: 60,
        },
      },
      example2: {
        summary: "Extended consultation",
        value: {
          serviceTypeId: "b2c3d4e5-f6a7-8901-2345-678901bcdefg",
          price: 200.0,
          durationMinutes: 90,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Service successfully created",
    type: Service,
  })
  @ApiBadRequestResponse({
    description:
      "Validation error - invalid input data (e.g., missing required field, " +
      "invalid UUID format, negative price, invalid duration)",
    schema: {
      example: {
        statusCode: 400,
        message: ["price must not be less than 0"],
        error: "Bad Request",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Trainer or service type not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Trainer with ID 'f47ac10b-58cc-4372-a567-0e02b2c3d479' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async create(@Body() createServiceDto: CreateServiceDto, @Request() request: IRequestApp): Promise<Service> {
    const userId = request.user.userId;
    return await this.servicesService.create(createServiceDto, userId);
  }

  /**
   * Gets a single service by ID
   *
   * GET /services/:id
   *
   * @param id - UUID of the service to retrieve
   * @returns Complete service information with trainer and service type details
   *
   * TODO: Add @UseGuards(JwtAuthGuard) when authentication is implemented
   */
  @Get(":id")
  @Public()
  @ApiOperation({
    summary: "Get a single service by ID",
    description:
      "Retrieves detailed information about a specific service including " +
      "related trainer and service type data. " +
      "This endpoint is publicly accessible.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the service to retrieve",
    example: "f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Service found and returned successfully",
    type: ServiceResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format for service ID",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid authentication token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service not found or has been deleted",
    schema: {
      example: {
        statusCode: 404,
        message: "Service with ID 'f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ServiceResponseDto> {
    return await this.servicesService.findOne(id);
  }

  /**
   * Updates a service (partial update)
   *
   * PATCH /services/:id
   *
   * @param id - UUID of the service to update
   * @param updateServiceDto - Fields to update
   * @returns Updated service with complete information
   *
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) when authentication is implemented
   * TODO: Add @Roles(UserRole.TRAINER) decorator when roles guard is implemented
   * TODO: Extract user from JWT token and pass to service
   */
  @Patch(":id")
  @Roles(UserRole.TRAINER)
  @ApiOperation({
    summary: "Update a service (partial update)",
    description:
      "Allows a trainer to update one of their own services. " +
      "Supports partial updates (PATCH semantics) - only provided fields are updated. " +
      "The operation is secured - only the service owner can update it. " +
      "Requires TRAINER role.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the service to update",
    example: "f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    format: "uuid",
  })
  @ApiBody({
    type: UpdateServiceDto,
    description: "Fields to update (all fields are optional)",
    examples: {
      updatePrice: {
        summary: "Update only price",
        value: {
          price: 175.0,
        },
      },
      updateDuration: {
        summary: "Update only duration",
        value: {
          durationMinutes: 90,
        },
      },
      updateMultiple: {
        summary: "Update multiple fields",
        value: {
          price: 200.0,
          durationMinutes: 120,
          serviceTypeId: "b2c3d4e5-f6a7-8901-2345-678901bcdefg",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Service successfully updated",
    type: ServiceResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Validation error - invalid input data (e.g., invalid UUID format, " + "negative price, invalid duration)",
    schema: {
      example: {
        statusCode: 400,
        message: ["price must not be less than 0"],
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid authentication token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service not found, already deleted, or not owned by the authenticated trainer",
    schema: {
      example: {
        statusCode: 404,
        message: "Service with ID 'f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() request: IRequestApp
  ): Promise<ServiceResponseDto> {
    const userId = request.user.userId;
    return await this.servicesService.update(id, userId, updateServiceDto);
  }

  /**
   * Deletes a service (soft delete)
   *
   * DELETE /services/:id
   *
   * @param id - UUID of the service to delete
   * @returns No content on successful deletion
   *
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) when authentication is implemented
   * TODO: Add @Roles(UserRole.TRAINER) decorator when roles guard is implemented
   * TODO: Extract user from JWT token and pass to service
   */
  @Delete(":id")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a service (soft delete)",
    description:
      "Allows a trainer to soft delete one of their own services. " +
      "The operation is idempotent and secured - only the service owner can delete it. " +
      "Deletion sets the deletedAt timestamp, preserving data for archival purposes. " +
      "Requires TRAINER role.",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the service to delete",
    example: "f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c",
    format: "uuid",
  })
  @ApiResponse({
    status: 204,
    description: "Service successfully deleted (soft delete)",
  })
  @ApiBadRequestResponse({
    description: "Invalid UUID format for service ID",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid authentication token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiForbiddenResponse({
    description: "User is not a trainer or not the owner of the service",
    schema: {
      example: {
        statusCode: 403,
        message: "You are not authorized to delete this service",
        error: "Forbidden",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Service not found or already deleted",
    schema: {
      example: {
        statusCode: 404,
        message: "Service with ID 'f8a0c0a8-4b3f-4c9e-8b1a-0e9e6a3e4b3c' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async remove(@Param("id", ParseUUIDPipe) id: string, @Request() request: IRequestApp): Promise<void> {
    const userId = request.user.userId;
    await this.servicesService.remove(id, userId);
  }
}
