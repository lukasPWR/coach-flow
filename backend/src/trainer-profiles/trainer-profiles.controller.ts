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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { TrainerProfilesService } from "./trainer-profiles.service";
import { CreateTrainerProfileDto } from "./dto/create-trainer-profile.dto";
import { UpdateTrainerProfileDto } from "./dto/update-trainer-profile.dto";
import { TrainerProfileResponseDto } from "./dto/trainer-profile-response.dto";
import { TrainerProfileIdParamDto } from "./dto/trainer-profile-id-param.dto";
import { GetUser } from "../common/decorators/get-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { User } from "../users/entities/user.entity";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "src/common/interfaces/request-app.interface";

@ApiTags("trainer-profiles")
@Controller("trainer-profiles")
export class TrainerProfilesController {
  constructor(private readonly trainerProfilesService: TrainerProfilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new trainer profile",
    description:
      "Creates a new trainer profile for an existing user with TRAINER role. Only accessible by administrators.",
  })
  @ApiBody({
    type: CreateTrainerProfileDto,
    description: "Trainer profile creation data",
    examples: {
      example1: {
        summary: "Basic trainer profile",
        value: {
          userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          description: "Doświadczony trener personalny z 10-letnim stażem.",
          city: "Warszawa",
        },
      },
      example2: {
        summary: "Trainer profile with specializations",
        value: {
          userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          description: "Doświadczony trener personalny z 10-letnim stażem.",
          city: "Warszawa",
          specializationIds: ["s1a2b3c4-e5f6-7890-1234-567890abcdef", "s2a2b3c4-e5f6-7890-1234-567890abcdef"],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Trainer profile successfully created",
    schema: {
      example: {
        id: "p1a2b3c4-e5f6-7890-1234-567890abcdef",
        userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        description: "Doświadczony trener personalny z 10-letnim stażem.",
        city: "Warszawa",
        profilePictureUrl: null,
        createdAt: "2025-11-16T10:00:00.000Z",
        updatedAt: "2025-11-16T10:00:00.000Z",
        specializations: [
          {
            id: "s1a2b3c4-e5f6-7890-1234-567890abcdef",
            name: "Trening siłowy",
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid input data, user is not a trainer, or invalid specialization IDs",
    schema: {
      example: {
        statusCode: 400,
        message: "User with ID a1b2c3d4-e5f6-7890-1234-567890abcdef is not a trainer. Current role: CLIENT",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Missing, invalid, or expired JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Conflict - Trainer profile already exists for this user",
    schema: {
      example: {
        statusCode: 409,
        message: "Trainer profile already exists for user with ID a1b2c3d4-e5f6-7890-1234-567890abcdef",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Unexpected server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async create(@Body() createTrainerProfileDto: CreateTrainerProfileDto) {
    return this.trainerProfilesService.create(createTrainerProfileDto);
  }

  @Get("me")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get authenticated trainer's profile",
    description:
      "Retrieves the complete profile of the authenticated trainer user, including personal details, specializations, and offered services. Only accessible by users with TRAINER role.",
  })
  @ApiResponse({
    status: 200,
    description: "Trainer profile successfully retrieved",
    type: TrainerProfileResponseDto,
    schema: {
      example: {
        id: "p1a2b3c4-e5f6-7890-1234-567890abcdef",
        userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        trainerName: "Anna Nowak",
        email: "anna.nowak@example.com",
        description: "Certyfikowany trener personalny z 10-letnim doświadczeniem...",
        city: "Warszawa",
        profilePictureUrl: "http://example.com/path/to/image.jpg",
        specializations: [
          { id: "s1...", name: "Trening siłowy" },
          { id: "s2...", name: "Utrata wagi" },
        ],
        services: [
          {
            id: "svc1...",
            name: "Trening personalny",
            price: 150.0,
            durationMinutes: 60,
          },
        ],
        createdAt: "2025-11-16T10:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Missing, invalid, or expired JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User does not have TRAINER role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: TRAINER",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Trainer profile does not exist for the authenticated user",
    schema: {
      example: {
        statusCode: 404,
        message: "Trainer profile for user a1b2c3d4-e5f6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  async getMyProfile(@Request() request: IRequestApp): Promise<TrainerProfileResponseDto> {
    const userId = request.user.userId;
    return this.trainerProfilesService.findMyProfileByUserId(userId);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get trainer profile by ID",
    description:
      "Retrieves detailed information about a single trainer profile including user name and specializations. Public endpoint - no authentication required.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the trainer profile",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Trainer profile successfully retrieved",
    type: TrainerProfileResponseDto,
    schema: {
      example: {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        userId: "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        trainerName: "Jan Kowalski",
        description: "Doświadczony trener personalny z 10-letnim stażem.",
        city: "Warszawa",
        profilePictureUrl: "https://example.com/profile.jpg",
        specializations: [
          { id: "c3d4e5f6-a7b8-9012-3456-7890abcdef12", name: "Trening siłowy" },
          { id: "d4e5f6a7-b8c9-0123-4567-890abcdef123", name: "Dietetyka" },
        ],
        createdAt: "2025-11-16T10:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid UUID format",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Trainer profile does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Trainer profile with ID a1b2c3d4-e5f6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Unexpected server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<TrainerProfileResponseDto> {
    return this.trainerProfilesService.findOne(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update trainer profile by ID",
    description:
      "Updates an existing trainer profile with partial data. Only provided fields will be updated. Accessible by the profile owner (TRAINER) or ADMIN.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the trainer profile to update",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    type: String,
  })
  @ApiBody({
    type: UpdateTrainerProfileDto,
    description: "Partial trainer profile update data - all fields are optional",
    examples: {
      updateDescription: {
        summary: "Update only description",
        value: {
          description: "Nowy, zaktualizowany opis trenera z 15-letnim doświadczeniem.",
        },
      },
      updateMultipleFields: {
        summary: "Update multiple fields",
        value: {
          description: "Zaktualizowany opis trenera.",
          city: "Kraków",
          profilePictureUrl: "https://example.com/new-photo.jpg",
        },
      },
      updateSpecializations: {
        summary: "Update specializations",
        value: {
          specializationIds: ["s1a2b3c4-e5f6-7890-1234-567890abcdef", "s2a2b3c4-e5f6-7890-1234-567890abcdef"],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Trainer profile successfully updated",
    schema: {
      example: {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        userId: "e5f6g7h8-i9j0-1234-5678-901234567890",
        description: "Nowy, zaktualizowany opis trenera.",
        city: "Kraków",
        profilePictureUrl: "https://example.com/new-photo.jpg",
        createdAt: "2025-11-16T10:00:00.000Z",
        updatedAt: "2025-11-16T12:30:00.000Z",
        specializations: [
          {
            id: "s1a2b3c4-e5f6-7890-1234-567890abcdef",
            name: "Trening siłowy",
          },
          {
            id: "s2a2b3c4-e5f6-7890-1234-567890abcdef",
            name: "Dietetyka",
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid UUID format or invalid specialization IDs",
    schema: {
      example: {
        statusCode: 400,
        message: "Validation failed (uuid is expected)",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Missing, invalid, or expired JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User does not have ADMIN role",
    schema: {
      example: {
        statusCode: 403,
        message: "Access denied. Required roles: ADMIN",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Trainer profile does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Trainer profile with ID a1b2c3d4-e5f6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Unexpected server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTrainerProfileDto: UpdateTrainerProfileDto,
    @Request() request: IRequestApp
  ) {
    const userId = request.user.userId;
    return this.trainerProfilesService.update(id, updateTrainerProfileDto, userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete a trainer profile",
    description:
      "Deletes an existing trainer profile. Only the profile owner or an administrator can perform this action. This is a hard delete operation that also removes all associated specializations.",
  })
  @ApiParam({
    name: "id",
    description: "Unique identifier (UUID) of the trainer profile to delete",
    type: String,
    format: "uuid",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @ApiResponse({
    status: 204,
    description: "Trainer profile successfully deleted - No content returned",
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid UUID format",
    schema: {
      example: {
        statusCode: 400,
        message: "ID must be a valid UUID v4",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Missing, invalid, or expired JWT token",
    schema: {
      example: {
        statusCode: 401,
        message: "Unauthorized",
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is neither the profile owner nor an administrator",
    schema: {
      example: {
        statusCode: 403,
        message: "You do not have permission to delete this trainer profile",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - Trainer profile does not exist",
    schema: {
      example: {
        statusCode: 404,
        message: "Trainer profile with ID a1b2c3d4-e5f6-7890-1234-567890abcdef not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error - Unexpected server error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async remove(@Param() { id }: TrainerProfileIdParamDto, @Request() request: IRequestApp): Promise<void> {
    const userId = request.user.userId;
    return this.trainerProfilesService.remove(id, userId);
  }
}
