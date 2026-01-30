import { DataSource } from "typeorm";
import { Specialization } from "../../../specializations/entities/specialization.entity";
import { SPECIALIZATIONS_SEED } from "../data/specializations.seed";

export class SpecializationsSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const repository = this.dataSource.getRepository(Specialization);

    console.log("🌱 Seeding specializations...");

    for (const specializationData of SPECIALIZATIONS_SEED) {
      const existing = await repository.findOne({
        where: { name: specializationData.name },
      });

      if (!existing) {
        const specialization = repository.create(specializationData);
        await repository.save(specialization);
        console.log(`  ✅ Created specialization: ${specializationData.name}`);
      } else {
        console.log(`  ⏭️  Specialization already exists: ${specializationData.name}`);
      }
    }

    console.log(`✅ Specializations seeding completed (${SPECIALIZATIONS_SEED.length} items)`);
  }
}
