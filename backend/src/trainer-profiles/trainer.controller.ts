import { Controller, Get, HttpCode, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { TrainerProfilesService } from "./trainer-profiles.service";
import { TrainerClientResponseDto } from "./dto/trainer-client.response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../users/interfaces/user-role.enum";
import type { IRequestApp } from "../common/interfaces/request-app.interface";

/**
 * Controller for trainer-specific endpoints under /trainer route.
 * Requires authentication and TRAINER role.
 */
@ApiTags("trainer")
@Controller("trainer")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrainerController {
  constructor(private readonly trainerProfilesService: TrainerProfilesService) {}

  /**
   * Retrieves a list of unique clients who have booking history with the authenticated trainer.
   * Used for selecting clients when creating training plans.
   *
   * GET /trainer/clients
   */
  @Get("clients")
  @Roles(UserRole.TRAINER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get trainer's unique clients",
    description:
      "Retrieves a list of all unique clients (users with CLIENT role) who have " +
      "booking history with the authenticated trainer. Returns minimal client data " +
      "(id, name, email) for use in training plan creation and other trainer workflows.",
  })
  @ApiResponse({
    status: 200,
    description: "Clients list retrieved successfully. Returns an empty array if no clients found.",
    type: [TrainerClientResponseDto],
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Jan Kowalski",
          email: "jan.kowalski@example.com",
        },
        {
          id: "987fcdeb-51a2-43c1-z567-123456789012",
          name: "Anna Nowak",
          email: "anna.nowak@example.com",
        },
      ],
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
    status: 500,
    description: "Internal Server Error - Unexpected server or database error",
    schema: {
      example: {
        statusCode: 500,
        message: "Internal server error",
      },
    },
  })
  async getClients(@Request() req: IRequestApp): Promise<TrainerClientResponseDto[]> {
    const trainerId = req.user.userId;
    return this.trainerProfilesService.getUniqueClients(trainerId);
  }
}
