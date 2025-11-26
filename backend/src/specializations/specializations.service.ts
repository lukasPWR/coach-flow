import {
  Injectable,
  ConflictException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, In } from "typeorm";
import { Specialization } from "./entities/specialization.entity";
import { TrainerProfile } from "../trainer-profiles/entities/trainer-profile.entity";
import { CreateSpecializationDto } from "./dto/create-specialization.dto";
import { UpdateSpecializationDto } from "./dto/update-specialization.dto";
import { SpecializationDto } from "./dto/specialization.dto";

/**
 * Service responsible for managing specializations (dictionary module)
 *
 * Handles CRUD operations for specializations with proper validation
 * and error handling. Specializations are used to categorize trainer expertise.
 */
@Injectable()
export class SpecializationsService {
  private readonly logger = new Logger(SpecializationsService.name);

  constructor(
    @InjectRepository(Specialization)
    private readonly specializationRepository: Repository<Specialization>,
    @InjectRepository(TrainerProfile)
    private readonly trainerProfileRepository: Repository<TrainerProfile>
  ) {}

  /**
   * Creates a new specialization
   *
   * Validates that the specialization name is unique before creating.
   * If a specialization with the same name already exists, throws ConflictException.
   *
   * @param createSpecializationDto - DTO containing specialization creation data
   * @returns The newly created specialization entity
   * @throws ConflictException if specialization with this name already exists
   * @throws InternalServerErrorException if database operation fails
   */
  async create(createSpecializationDto: CreateSpecializationDto): Promise<Specialization> {
    const { name } = createSpecializationDto;

    try {
      // Check if specialization with this name already exists
      const existingSpecialization = await this.specializationRepository.findOneBy({
        name,
      });

      if (existingSpecialization) {
        this.logger.warn(`Attempt to create duplicate specialization with name: ${name}`);
        throw new ConflictException("Specialization with this name already exists");
      }

      // Create new specialization entity
      const specialization = this.specializationRepository.create({
        name,
      });

      // Save and return the specialization
      const savedSpecialization = await this.specializationRepository.save(specialization);

      this.logger.log(`Specialization created successfully with id: ${savedSpecialization.id}`);

      return savedSpecialization;
    } catch (error) {
      // Re-throw ConflictException as-is
      if (error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to create specialization: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to create specialization. Please try again later.");
    }
  }

  /**
   * Retrieves all specializations
   *
   * Returns a list of all available specializations in the system.
   * Used by public endpoints to provide dictionary data.
   *
   * @returns Array of specialization DTOs containing id and name
   * @throws InternalServerErrorException if database operation fails
   */
  async findAll(): Promise<SpecializationDto[]> {
    try {
      const specializations = await this.specializationRepository.find({
        order: { name: "ASC" },
      });

      return specializations.map((spec) => ({
        id: spec.id,
        name: spec.name,
      }));
    } catch (error) {
      this.logger.error(`Failed to retrieve specializations: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve specializations. Please try again later.");
    }
  }

  /**
   * Finds a single specialization by its unique ID
   *
   * Retrieves a specialization from the database using primary key lookup.
   * Throws NotFoundException if no specialization with the given ID exists.
   *
   * @param id - The UUID of the specialization to find
   * @returns The found specialization entity
   * @throws NotFoundException if specialization with given ID does not exist
   * @throws InternalServerErrorException if database operation fails
   */
  async findOne(id: string): Promise<Specialization> {
    try {
      const specialization = await this.specializationRepository.findOneBy({ id });

      if (!specialization) {
        this.logger.warn(`Specialization not found with id: ${id}`);
        throw new NotFoundException("Specialization not found");
      }

      return specialization;
    } catch (error) {
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to find specialization with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve specialization. Please try again later.");
    }
  }

  /**
   * Updates an existing specialization
   *
   * Validates that the specialization exists and that the new name is unique
   * before performing the update.
   *
   * @param id - The UUID of the specialization to update
   * @param updateSpecializationDto - DTO containing the new specialization data
   * @returns The updated specialization entity
   * @throws NotFoundException if specialization with given ID does not exist
   * @throws ConflictException if another specialization with the new name already exists
   * @throws InternalServerErrorException if database operation fails
   */
  async update(id: string, updateSpecializationDto: UpdateSpecializationDto): Promise<Specialization> {
    const { name } = updateSpecializationDto;

    try {
      // Check if specialization exists
      const specialization = await this.specializationRepository.findOneBy({ id });

      if (!specialization) {
        this.logger.warn(`Specialization not found with id: ${id}`);
        throw new NotFoundException(`Specialization with id ${id} not found`);
      }

      // Check if another specialization with the new name already exists
      const existingWithName = await this.specializationRepository.findOneBy({
        name,
        id: Not(id),
      });

      if (existingWithName) {
        this.logger.warn(`Attempt to update specialization to duplicate name: ${name}`);
        throw new ConflictException(`Specialization with name '${name}' already exists`);
      }

      // Update and save the specialization
      specialization.name = name;
      const updatedSpecialization = await this.specializationRepository.save(specialization);

      this.logger.log(`Specialization updated successfully with id: ${id}`);

      return updatedSpecialization;
    } catch (error) {
      // Re-throw known exceptions as-is
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to update specialization with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to update specialization. Please try again later.");
    }
  }

  /**
   * Deletes an existing specialization
   *
   * Validates that the specialization exists and is not associated with any trainer profiles.
   * Performs hard delete operation.
   *
   * @param id - The UUID of the specialization to delete
   * @throws NotFoundException if specialization with given ID does not exist
   * @throws ForbiddenException if specialization is in use by trainer profiles
   * @throws InternalServerErrorException if database operation fails
   */
  async deleteSpecialization(id: string): Promise<void> {
    try {
      // Check if specialization exists
      const specialization = await this.specializationRepository.findOneBy({ id });

      if (!specialization) {
        this.logger.warn(`Specialization not found with id: ${id}`);
        throw new NotFoundException("Specialization not found");
      }

      // Check if specialization is in use by any trainer profiles
      // We need to check if there are any trainer profiles that have this specialization
      const profilesWithSpecialization = await this.trainerProfileRepository.find({
        where: {
          specializations: {
            id: In([id]),
          },
        },
        relations: ["specializations"],
        select: ["id"],
      });

      if (profilesWithSpecialization.length > 0) {
        this.logger.warn(
          `Attempt to delete specialization in use by ${profilesWithSpecialization.length} trainer profiles`
        );
        throw new ForbiddenException("Specialization is currently in use by trainer profiles and cannot be deleted");
      }

      // Perform hard delete
      await this.specializationRepository.delete({ id });

      this.logger.log(`Specialization deleted successfully with id: ${id}`);
    } catch (error) {
      // Re-throw known exceptions as-is
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to delete specialization with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to delete specialization. Please try again later.");
    }
  }
}
