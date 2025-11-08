import { Injectable, ConflictException, Logger, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceType } from "./entities/service-type.entity";
import { Service } from "../services/entities/service.entity";
import { CreateServiceTypeDto } from "./dto/create-service-type.dto";
import { UpdateServiceTypeDto } from "./dto/update-service-type.dto";

/**
 * Service responsible for managing service types (dictionary module)
 *
 * Handles CRUD operations for service types with proper validation
 * and error handling. Service types are used to categorize services
 * offered by trainers.
 */
@Injectable()
export class ServiceTypesService {
  private readonly logger = new Logger(ServiceTypesService.name);

  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>
  ) {}

  /**
   * Creates a new service type
   *
   * Validates that the service type name is unique before creating.
   * If a service type with the same name already exists, throws ConflictException.
   *
   * @param createServiceTypeDto - DTO containing service type creation data
   * @returns The newly created service type entity
   * @throws ConflictException if service type with this name already exists
   * @throws InternalServerErrorException if database operation fails
   */
  async create(createServiceTypeDto: CreateServiceTypeDto): Promise<ServiceType> {
    const { name } = createServiceTypeDto;

    try {
      // Check if service type with this name already exists
      const existingServiceType = await this.serviceTypeRepository.findOneBy({
        name,
      });

      if (existingServiceType) {
        this.logger.warn(`Attempt to create duplicate service type with name: ${name}`);
        throw new ConflictException("Service type with this name already exists");
      }

      // Create new service type entity
      const serviceType = this.serviceTypeRepository.create({
        name,
      });

      // Save and return the service type
      const savedServiceType = await this.serviceTypeRepository.save(serviceType);

      this.logger.log(`Service type created successfully with id: ${savedServiceType.id}`);

      return savedServiceType;
    } catch (error) {
      // Re-throw ConflictException as-is
      if (error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to create service type: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to create service type. Please try again later.");
    }
  }

  /**
   * Retrieves all service types from the database
   *
   * Returns a complete list of all available service types.
   * This is a dictionary endpoint, so the number of records is expected
   * to be small and pagination is not required.
   *
   * @returns Array of all service type entities
   * @throws InternalServerErrorException if database operation fails
   */
  async findAll(): Promise<ServiceType[]> {
    try {
      const serviceTypes = await this.serviceTypeRepository.find();

      this.logger.log(`Retrieved ${serviceTypes.length} service types`);

      return serviceTypes;
    } catch (error) {
      // Log and wrap any errors as InternalServerErrorException
      this.logger.error(`Failed to retrieve service types: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve service types. Please try again later.");
    }
  }

  /**
   * Retrieves a single service type by its UUID
   *
   * Searches for a service type with the specified ID.
   * If not found, throws NotFoundException.
   *
   * @param id - UUID of the service type to retrieve
   * @returns The service type entity with the specified ID
   * @throws NotFoundException if service type with given ID does not exist
   * @throws InternalServerErrorException if database operation fails
   */
  async findOne(id: string): Promise<ServiceType> {
    try {
      const serviceType = await this.serviceTypeRepository.findOneBy({ id });

      if (!serviceType) {
        this.logger.warn(`Service type not found with id: ${id}`);
        throw new NotFoundException(`Service type with id ${id} not found`);
      }

      this.logger.log(`Retrieved service type with id: ${id}`);

      return serviceType;
    } catch (error) {
      // Re-throw NotFoundException as-is
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to retrieve service type with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve service type. Please try again later.");
    }
  }

  /**
   * Updates an existing service type
   *
   * Finds the service type by ID and updates its properties based on the provided DTO.
   * If the service type does not exist, throws NotFoundException.
   * If a service type with the new name already exists (and it's not the same entity),
   * throws ConflictException.
   *
   * @param id - UUID of the service type to update
   * @param updateServiceTypeDto - DTO containing fields to update
   * @returns The updated service type entity
   * @throws NotFoundException if service type with given ID does not exist
   * @throws ConflictException if service type with new name already exists
   * @throws InternalServerErrorException if database operation fails
   */
  async update(id: string, updateServiceTypeDto: UpdateServiceTypeDto): Promise<ServiceType> {
    try {
      // Find the existing service type
      const serviceType = await this.findOne(id);

      // If name is being updated, check for uniqueness
      if (updateServiceTypeDto.name && updateServiceTypeDto.name !== serviceType.name) {
        const existingServiceType = await this.serviceTypeRepository.findOneBy({
          name: updateServiceTypeDto.name,
        });

        if (existingServiceType) {
          this.logger.warn(`Attempt to update service type ${id} with duplicate name: ${updateServiceTypeDto.name}`);
          throw new ConflictException("Service type with this name already exists");
        }
      }

      // Update the service type properties
      if (updateServiceTypeDto.name !== undefined) {
        serviceType.name = updateServiceTypeDto.name;
      }

      // Save and return the updated service type
      const updatedServiceType = await this.serviceTypeRepository.save(serviceType);

      this.logger.log(`Service type updated successfully with id: ${id}`);

      return updatedServiceType;
    } catch (error) {
      // Re-throw known exceptions as-is
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to update service type with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to update service type. Please try again later.");
    }
  }

  /**
   * Deletes a service type
   *
   * Permanently removes a service type from the system. This operation is restricted
   * and can only be performed if the service type is not associated with any active services.
   * If the service type is in use, throws ConflictException.
   * If the service type does not exist, throws NotFoundException.
   *
   * @param id - UUID of the service type to delete
   * @returns Promise<void>
   * @throws NotFoundException if service type with given ID does not exist
   * @throws ConflictException if service type is used by any services
   * @throws InternalServerErrorException if database operation fails
   */
  async remove(id: string): Promise<void> {
    try {
      // Check if the service type is used by any services
      // Note: We check for services that are NOT soft-deleted (deletedAt is NULL)
      const servicesCount = await this.serviceRepository.count({
        where: {
          serviceTypeId: id,
          deletedAt: null as any, // TypeORM requires explicit null for checking IS NULL
        },
      });

      if (servicesCount > 0) {
        this.logger.warn(`Attempt to delete service type ${id} that is used by ${servicesCount} service(s)`);
        throw new ConflictException("Cannot delete service type that is currently in use by services");
      }

      // Attempt to delete the service type
      const deleteResult = await this.serviceTypeRepository.delete(id);

      // Check if any rows were affected (if not, the service type didn't exist)
      if (!deleteResult.affected || deleteResult.affected === 0) {
        this.logger.warn(`Attempt to delete non-existent service type with id: ${id}`);
        throw new NotFoundException(`Service type with id ${id} not found`);
      }

      this.logger.log(`Service type deleted successfully with id: ${id}`);
    } catch (error) {
      // Re-throw known exceptions as-is
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      // Log and wrap any other errors as InternalServerErrorException
      this.logger.error(`Failed to delete service type with id ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to delete service type. Please try again later.");
    }
  }
}
