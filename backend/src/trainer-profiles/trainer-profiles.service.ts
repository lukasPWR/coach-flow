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
import { UserRole } from "../users/interfaces/user-role.enum";

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
    private readonly serviceRepository: Repository<Service>
  ) {}

  /**
   * Creates a new trainer profile.
   * Validates user existence, role, and prevents duplicate profiles.
   */
  async create(createTrainerProfileDto: CreateTrainerProfileDto): Promise<TrainerProfile> {
    const { userId, specializationIds, description, city, profilePictureUrl } = createTrainerProfileDto;

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
}
