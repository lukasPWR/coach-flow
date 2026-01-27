import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { TrainerProfile } from "./entities/trainer-profile.entity";
import { User } from "../users/entities/user.entity";
import { Specialization } from "../specializations/entities/specialization.entity";
import { Service } from "../services/entities/service.entity";
import { CreateTrainerProfileDto } from "./dto/create-trainer-profile.dto";
import { UpdateTrainerProfileDto } from "./dto/update-trainer-profile.dto";
import { TrainerProfileResponseDto, SpecializationDto, ServiceDto } from "./dto/trainer-profile-response.dto";
import { TrainerClientResponseDto } from "./dto/trainer-client.response.dto";
import { FindTrainersQueryDto } from "./dto/find-trainers-query.dto";
import { PaginatedTrainersResponseDto, PaginationMetaDto } from "./dto/paginated-trainers.response.dto";
import { TrainerPublicProfileResponseDto } from "./dto/trainer-public-profile.response.dto";
import {
  PublicTrainerProfileResponseDto,
  TrainerServiceDto,
  SpecializationDto as PublicSpecializationDto,
} from "./dto/public-trainer-profile.response.dto";
import { UserRole } from "../users/interfaces/user-role.enum";
import { GetUnavailabilitiesQueryDto } from "../unavailabilities/dto/get-unavailabilities-query.dto";
import { BookedSlotResponseDto } from "../bookings/dto/booked-slot-response.dto";
import { BookingsRepository } from "../bookings/repositories/bookings.repository";

@Injectable()
export class TrainerProfilesService {
  constructor(
    @InjectRepository(TrainerProfile)
    private readonly trainerProfileRepository: Repository<TrainerProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Specialization)
    private readonly specializationRepository: Repository<Specialization>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly bookingsRepository: BookingsRepository
  ) {}

  /**
   * Creates a new trainer profile for the authenticated user.
   * Validates user existence, role, and prevents duplicate profiles.
   * @param createTrainerProfileDto - Profile data (without userId)
   * @param userId - ID of the authenticated user from JWT token
   * @returns Created TrainerProfile with relations
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if user is not a trainer
   * @throws ConflictException if profile already exists
   */
  async create(createTrainerProfileDto: CreateTrainerProfileDto, userId: string): Promise<TrainerProfile> {
    const { specializationIds, description, city, profilePictureUrl } = createTrainerProfileDto;

    // 1. Validate user exists and has TRAINER role
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== UserRole.TRAINER) {
      throw new BadRequestException(`User with ID ${userId} is not a trainer. Current role: ${user.role}`);
    }

    // 2. Check if trainer profile already exists for this user
    const existingProfile = await this.trainerProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(`Trainer profile already exists for user with ID ${userId}`);
    }

    // 3. Validate specializations if provided
    let specializations: Specialization[] = [];
    if (specializationIds && specializationIds.length > 0) {
      specializations = await this.specializationRepository.find({
        where: { id: In(specializationIds) },
      });

      // Check if all provided specialization IDs are valid
      if (specializations.length !== specializationIds.length) {
        const foundIds = specializations.map((s) => s.id);
        const invalidIds = specializationIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(`Invalid specialization IDs: ${invalidIds.join(", ")}`);
      }
    }

    // 4. Create new trainer profile
    const trainerProfile = this.trainerProfileRepository.create({
      userId,
      description,
      city,
      profilePictureUrl,
      specializations,
    });

    // 5. Save and return with relations
    const savedProfile = await this.trainerProfileRepository.save(trainerProfile);

    // Return profile with specializations loaded
    const profileWithRelations = await this.trainerProfileRepository.findOne({
      where: { id: savedProfile.id },
      relations: ["specializations"],
    });

    if (!profileWithRelations) {
      throw new NotFoundException(`Failed to retrieve saved profile with ID ${savedProfile.id}`);
    }

    return profileWithRelations;
  }

  /**
   * Retrieves a paginated and filtered list of public trainer profiles.
   * Public endpoint - no authentication required.
   * Supports filtering by city and specialization, with pagination.
   *
   * @param query - Query parameters for filtering and pagination
   * @returns PaginatedTrainersResponseDto with trainer list and metadata
   */
  async findAllPublic(query: FindTrainersQueryDto): Promise<PaginatedTrainersResponseDto> {
    const { page, limit, city, specializationId } = query;

    // Calculate pagination offset
    const skip = (page - 1) * limit;

    // Build query using QueryBuilder for complex joins and filtering
    const queryBuilder = this.trainerProfileRepository
      .createQueryBuilder("profile")
      .innerJoin("profile.user", "user")
      .leftJoinAndSelect("profile.specializations", "specialization")
      .select([
        "profile.id",
        "profile.city",
        "profile.description",
        "profile.profilePictureUrl",
        "user.id",
        "user.name",
        "specialization.id",
        "specialization.name",
      ]);

    // Apply city filter if provided (case-insensitive)
    if (city) {
      queryBuilder.andWhere("LOWER(profile.city) = LOWER(:city)", { city });
    }

    // Apply specialization filter if provided
    if (specializationId) {
      queryBuilder.andWhere("specialization.id = :specializationId", { specializationId });
    }

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query and count total
    const [profiles, total] = await queryBuilder.getManyAndCount();

    // Map entities to public DTOs
    const data: TrainerPublicProfileResponseDto[] = profiles.map((profile) => ({
      id: profile.user.id,
      name: profile.user.name,
      city: profile.city ?? undefined,
      description: profile.description ?? undefined,
      profilePictureUrl: profile.profilePictureUrl ?? undefined,
      specializations: (profile.specializations || []).map((spec) => ({
        id: spec.id,
        name: spec.name,
      })),
    }));

    // Build pagination metadata
    const meta: PaginationMetaDto = {
      total,
      page,
      limit,
    };

    return { data, meta };
  }

  /**
   * Retrieves public profile details of a single trainer by user ID.
   * Includes user data, trainer profile, specializations, and services.
   * This is a public endpoint - no authentication required.
   * @param userId - UUID of the user (must have TRAINER role)
   * @returns PublicTrainerProfileResponseDto with full trainer details
   * @throws NotFoundException if user doesn't exist or is not a trainer
   */
  async findPublicProfileByUserId(userId: string): Promise<PublicTrainerProfileResponseDto> {
    // 1. Build optimized query with all required joins
    const result = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.trainerProfile", "profile")
      .leftJoinAndSelect("profile.specializations", "specialization")
      .leftJoinAndSelect("user.services", "service")
      .leftJoinAndSelect("service.serviceType", "serviceType")
      .where("user.id = :userId", { userId })
      .andWhere("user.role = :role", { role: UserRole.TRAINER })
      .andWhere("service.deletedAt IS NULL")
      .getOne();

    // 2. Validate trainer exists
    if (!result || !result.trainerProfile) {
      throw new NotFoundException(`Trainer with ID ${userId} not found or user does not have a trainer profile`);
    }

    // 3. Map to response DTO
    const profile = result.trainerProfile;

    const specializations: PublicSpecializationDto[] = (profile.specializations || []).map((spec) => ({
      id: spec.id,
      name: spec.name,
    }));

    const services: TrainerServiceDto[] = (result.services || [])
      .filter((service) => !service.deletedAt)
      .map((service) => ({
        id: service.id,
        name: service.serviceType?.name || "",
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
      }));

    return {
      id: result.id,
      name: result.name,
      city: profile.city ?? undefined,
      description: profile.description ?? undefined,
      profilePictureUrl: profile.profilePictureUrl ?? undefined,
      specializations,
      services,
    };
  }

  /**
   * Retrieves a single trainer profile by ID with related user and specializations.
   * @param id - UUID of the trainer profile
   * @returns TrainerProfileResponseDto with profile details
   * @throws NotFoundException if profile doesn't exist
   */
  async findOne(id: string): Promise<TrainerProfileResponseDto> {
    // Fetch profile with user and specializations relations in a single query
    const profile = await this.trainerProfileRepository.findOne({
      where: { id },
      relations: ["user", "specializations"],
    });

    // Check if profile exists
    if (!profile) {
      throw new NotFoundException(`Trainer profile with ID ${id} not found`);
    }

    // Map entity to response DTO
    return this.mapToResponseDto(profile);
  }

  /**
   * Updates an existing trainer profile with partial data.
   * Only provided fields will be updated.
   * @param id - UUID of the trainer profile to update
   * @param updateTrainerProfileDto - Partial update data
   * @param userId - Authenticated user's ID (for ownership verification)
   * @returns Updated TrainerProfile entity with relations
   * @throws NotFoundException if profile doesn't exist
   * @throws ForbiddenException if user is not the owner and not an admin
   * @throws BadRequestException if specialization IDs are invalid
   */
  async update(id: string, updateTrainerProfileDto: UpdateTrainerProfileDto, userId: string): Promise<TrainerProfile> {
    const { specializationIds, description, city, profilePictureUrl } = updateTrainerProfileDto;

    // 1. Find existing profile with specializations
    const profile = await this.trainerProfileRepository.findOne({
      where: { id },
      relations: ["specializations"],
    });

    if (!profile) {
      throw new NotFoundException(`Trainer profile with ID ${id} not found`);
    }

    // 2. Verify ownership (only profile owner or admin can update)
    if (profile.userId !== userId) {
      throw new ForbiddenException("You do not have permission to update this trainer profile");
    }

    // 3. Update basic fields if provided
    if (description !== undefined) {
      profile.description = description;
    }

    if (city !== undefined) {
      profile.city = city;
    }

    if (profilePictureUrl !== undefined) {
      profile.profilePictureUrl = profilePictureUrl;
    }

    // 3. Update specializations if provided
    if (specializationIds !== undefined) {
      if (specializationIds.length === 0) {
        // Clear all specializations if empty array provided
        profile.specializations = [];
      } else {
        // Validate and fetch new specializations
        const specializations = await this.specializationRepository.find({
          where: { id: In(specializationIds) },
        });

        // Check if all provided specialization IDs are valid
        if (specializations.length !== specializationIds.length) {
          const foundIds = specializations.map((s) => s.id);
          const invalidIds = specializationIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Invalid specialization IDs: ${invalidIds.join(", ")}`);
        }

        profile.specializations = specializations;
      }
    }

    // 4. Save updated profile
    const savedProfile = await this.trainerProfileRepository.save(profile);

    // 5. Return profile with all relations loaded
    const profileWithRelations = await this.trainerProfileRepository.findOne({
      where: { id: savedProfile.id },
      relations: ["specializations"],
    });

    if (!profileWithRelations) {
      throw new NotFoundException(`Failed to retrieve updated profile with ID ${savedProfile.id}`);
    }

    return profileWithRelations;
  }

  /**
   * Maps TrainerProfile entity to TrainerProfileResponseDto.
   * @param profile - TrainerProfile entity with loaded relations
   * @param services - Optional array of Service entities with serviceType relation
   * @returns TrainerProfileResponseDto
   */
  private mapToResponseDto(profile: TrainerProfile, services: Service[] = []): TrainerProfileResponseDto {
    const specializationsDto: SpecializationDto[] = profile.specializations.map((spec) => ({
      id: spec.id,
      name: spec.name,
    }));

    const servicesDto: ServiceDto[] = services.map((service) => ({
      id: service.id,
      name: service.serviceType.name,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
    }));

    return {
      id: profile.id,
      userId: profile.userId,
      trainerName: profile.user.name,
      email: profile.user.email,
      description: profile.description,
      city: profile.city,
      profilePictureUrl: profile.profilePictureUrl,
      specializations: specializationsDto,
      services: servicesDto,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Removes a trainer profile by ID.
   * Only the profile owner or an administrator can delete the profile.
   * Implements hard delete with cascading removal of related specializations.
   *
   * @param id - UUID of the trainer profile to delete
   * @param user - Authenticated user performing the operation
   * @throws NotFoundException if profile does not exist
   * @throws ForbiddenException if user lacks permission to delete the profile
   */
  async remove(id: string, userId: string): Promise<void> {
    // 1. Find the trainer profile
    const profile = await this.trainerProfileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Trainer profile with ID ${id} not found`);
    }

    // 2. Check authorization: user must be profile owner or admin
    const isOwner = userId === profile.userId;

    if (!isOwner) {
      throw new ForbiddenException("You do not have permission to delete this trainer profile");
    }

    // 3. Delete the profile (cascade will handle trainer_specializations)
    await this.trainerProfileRepository.delete(id);
  }

  /**
   * Retrieves trainer profile for the authenticated trainer user.
   * Includes user details, specializations, and offered services.
   * @param userId - ID of the authenticated user
   * @returns Complete trainer profile with all relations
   * @throws NotFoundException if profile doesn't exist
   */
  async findMyProfileByUserId(userId: string): Promise<TrainerProfileResponseDto> {
    // 1. Query the database with all required relations
    const profile = await this.trainerProfileRepository
      .createQueryBuilder("profile")
      .leftJoinAndSelect("profile.user", "user")
      .leftJoinAndSelect("profile.specializations", "specialization")
      .where("profile.userId = :userId", { userId })
      .getOne();

    // 2. Handle not found case
    if (!profile) {
      throw new NotFoundException(`Trainer profile for user ${userId} not found`);
    }

    // 3. Fetch services for this trainer
    const services = await this.serviceRepository
      .createQueryBuilder("service")
      .leftJoinAndSelect("service.serviceType", "serviceType")
      .where("service.trainerId = :userId", { userId })
      .andWhere("service.deletedAt IS NULL")
      .getMany();

    // 4. Map to response DTO
    return this.mapToResponseDto(profile, services);
  }

  /**
   * Retrieves booked slots for a trainer, filtered by optional date range.
   * Used by public booking flow to mark occupied time slots.
   *
   * @param trainerId - UUID of the trainer
   * @param query - Query parameters with optional from/to date filters
   * @returns Array of booked slots with startTime and endTime
   */
  async findBookedSlotsByTrainerId(
    trainerId: string,
    query: GetUnavailabilitiesQueryDto
  ): Promise<BookedSlotResponseDto[]> {
    const { from, to } = query;
    return this.bookingsRepository.findBookedSlotsByTrainerId(trainerId, from, to);
  }

  /**
   * Retrieves a list of unique clients (users with CLIENT role) who have
   * booking history with the specified trainer.
   *
   * Used for training plan creation - allows trainer to select from
   * their existing clients.
   *
   * @param trainerId - UUID of the trainer (from JWT token)
   * @returns Array of unique clients with minimal data (id, name, email)
   */
  async getUniqueClients(trainerId: string): Promise<TrainerClientResponseDto[]> {
    return this.bookingsRepository.findUniqueClientsByTrainerId(trainerId);
  }

  /**
   * Retrieves details of a specific client for the authenticated trainer.
   * Validates that the trainer has a booking relationship with the client.
   *
   * @param trainerId - UUID of the trainer (from JWT token)
   * @param clientId - UUID of the client to retrieve
   * @returns Client data (id, name, email)
   * @throws NotFoundException if client does not exist
   * @throws ForbiddenException if client is not associated with this trainer
   */
  async getClientById(trainerId: string, clientId: string): Promise<TrainerClientResponseDto> {
    // First check if the user exists
    const userExists = await this.userRepository.findOne({
      where: { id: clientId },
      select: ["id"],
    });

    if (!userExists) {
      throw new NotFoundException("Client not found");
    }

    // Check trainer-client relationship through bookings
    const clientData = await this.bookingsRepository.findClientOfTrainer(trainerId, clientId);

    if (!clientData) {
      throw new ForbiddenException("Client is not associated with this trainer");
    }

    return {
      id: clientData.id,
      name: clientData.name,
      email: clientData.email,
    };
  }
}
