import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { Service } from "./entities/service.entity";
import { User } from "../users/entities/user.entity";
import { ServiceType } from "../service-types/entities/service-type.entity";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceResponseDto } from "./dto/service-response.dto";

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>
  ) {}

  /**
   * Creates a new service for a trainer
   *
   * @param createServiceDto - DTO containing service creation data
   * @returns The newly created service entity
   * @throws NotFoundException if trainer or service type doesn't exist
   */
  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { serviceTypeId, price, durationMinutes } = createServiceDto;

    // TODO:Verify that the trainer exists

    // Verify that the service type exists
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id: serviceTypeId },
    });

    if (!serviceType) {
      throw new NotFoundException(`Service type with ID '${serviceTypeId}' not found`);
    }

    // Create new service entity
    const service = this.serviceRepository.create({
      serviceTypeId,
      price,
      durationMinutes,
    });

    // Save and return the service
    return await this.serviceRepository.save(service);
  }

  /**
   * Finds a single service by ID with related trainer and service type data
   *
   * @param id - UUID of the service to find
   * @returns ServiceResponseDto with complete service information
   * @throws NotFoundException if service doesn't exist or has been soft deleted
   */
  async findOne(id: string): Promise<ServiceResponseDto> {
    // Fetch service with relations, excluding soft-deleted records
    const service = await this.serviceRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ["trainer", "serviceType"],
    });

    // Throw exception if service not found
    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    // Map entity to response DTO
    return this.mapToResponseDto(service);
  }

  /**
   * Updates an existing service
   *
   * Only the trainer who owns the service can update it.
   * Supports partial updates (PATCH semantics) - only provided fields are updated.
   *
   * @param id - UUID of the service to update
   * @param userId - UUID of the authenticated user (trainer)
   * @param updateServiceDto - DTO containing fields to update
   * @returns ServiceResponseDto with updated service information
   * @throws NotFoundException if service doesn't exist or is already deleted
   * @throws ForbiddenException if user is not the owner of the service
   */
  async update(id: string, userId: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    // Find the service, excluding soft-deleted records
    const service = await this.serviceRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    // Throw exception if service not found
    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    // Verify ownership - only the trainer who created the service can update it
    if (service.trainerId !== userId) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    // If serviceTypeId is being updated, verify it exists
    if (updateServiceDto.serviceTypeId) {
      const serviceType = await this.serviceTypeRepository.findOne({
        where: { id: updateServiceDto.serviceTypeId },
      });

      if (!serviceType) {
        throw new NotFoundException(`Service type with ID '${updateServiceDto.serviceTypeId}' not found`);
      }
    }

    // Update the service with provided fields
    await this.serviceRepository.update(id, updateServiceDto);

    // Fetch the updated service with relations
    const updatedService = await this.serviceRepository.findOne({
      where: { id },
      relations: ["trainer", "serviceType"],
    });

    // This should never happen as we just updated the service, but TypeScript needs the check
    if (!updatedService) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    // Map entity to response DTO
    return this.mapToResponseDto(updatedService);
  }

  /**
   * Soft deletes a service by ID
   *
   * Only the trainer who owns the service can delete it.
   * The service is not physically removed from the database,
   * but marked as deleted by setting the deletedAt timestamp.
   *
   * @param id - UUID of the service to delete
   * @param userId - UUID of the authenticated user (trainer)
   * @throws NotFoundException if service doesn't exist or is already deleted
   * @throws ForbiddenException if user is not the owner of the service
   */
  async remove(id: string, userId: string): Promise<void> {
    // Find the service, excluding soft-deleted records
    const service = await this.serviceRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    // Throw exception if service not found
    if (!service) {
      throw new NotFoundException(`Service with ID '${id}' not found`);
    }

    // Verify ownership - only the trainer who created the service can delete it
    if (service.trainerId !== userId) {
      throw new ForbiddenException("You are not authorized to delete this service");
    }

    // Perform soft delete by setting deletedAt timestamp
    await this.serviceRepository.update(id, {
      deletedAt: new Date(),
    });
  }

  /**
   * Maps a Service entity to ServiceResponseDto
   *
   * @param service - Service entity with loaded relations
   * @returns ServiceResponseDto
   */
  private mapToResponseDto(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      price: Number(service.price), // Convert decimal to number
      durationMinutes: service.durationMinutes,
      trainer: {
        id: service.trainer.id,
        name: service.trainer.name,
      },
      serviceType: {
        id: service.serviceType.id,
        name: service.serviceType.name,
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
