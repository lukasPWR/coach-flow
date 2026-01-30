import { DataSource } from "typeorm";
import { ServiceType } from "../../../service-types/entities/service-type.entity";
import { SERVICE_TYPES_SEED } from "../data/service-types.seed";

export class ServiceTypesSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const repository = this.dataSource.getRepository(ServiceType);

    console.log("🌱 Seeding service types...");

    for (const serviceTypeData of SERVICE_TYPES_SEED) {
      const existing = await repository.findOne({
        where: { name: serviceTypeData.name },
      });

      if (!existing) {
        const serviceType = repository.create(serviceTypeData);
        await repository.save(serviceType);
        console.log(`  ✅ Created service type: ${serviceTypeData.name}`);
      } else {
        console.log(`  ⏭️  Service type already exists: ${serviceTypeData.name}`);
      }
    }

    console.log(`✅ Service types seeding completed (${SERVICE_TYPES_SEED.length} items)`);
  }
}
