import { DataSource } from "typeorm";
import { User, UserRole } from "../../../users/entities/user.entity";
import { ServiceType } from "../../../service-types/entities/service-type.entity";
import { Service } from "../../../services/entities/service.entity";
import { SERVICES_SEED } from "../data/users.seed";

export class ServicesSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const serviceTypeRepository = this.dataSource.getRepository(ServiceType);
    const serviceRepository = this.dataSource.getRepository(Service);

    console.log("🌱 Seeding trainer services...");

    for (const serviceData of SERVICES_SEED) {
      // Find trainer user
      const trainer = await userRepository.findOne({
        where: { email: serviceData.trainerEmail, role: UserRole.TRAINER },
      });

      if (!trainer) {
        console.log(`  ⚠️  Trainer not found: ${serviceData.trainerEmail}`);
        continue;
      }

      // Find service type
      const serviceType = await serviceTypeRepository.findOne({
        where: { name: serviceData.serviceTypeName },
      });

      if (!serviceType) {
        console.log(`  ⚠️  Service type not found: ${serviceData.serviceTypeName}`);
        continue;
      }

      // Check if service already exists
      const existingService = await serviceRepository.findOne({
        where: {
          trainerId: trainer.id,
          serviceTypeId: serviceType.id,
        },
      });

      if (existingService) {
        console.log(`  ⏭️  Service already exists: ${serviceData.serviceTypeName} for ${serviceData.trainerEmail}`);
        continue;
      }

      // Create service
      const service = serviceRepository.create({
        trainerId: trainer.id,
        serviceTypeId: serviceType.id,
        price: serviceData.price,
        durationMinutes: serviceData.durationMinutes,
      });

      await serviceRepository.save(service);
      console.log(`  ✅ Created service: ${serviceData.serviceTypeName} (${serviceData.price} PLN)`);
    }

    console.log(`✅ Services seeding completed`);
  }
}
