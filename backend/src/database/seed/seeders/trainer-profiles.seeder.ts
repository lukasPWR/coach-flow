import { DataSource } from "typeorm";
import { User, UserRole } from "../../../users/entities/user.entity";
import { TrainerProfile } from "../../../trainer-profiles/entities/trainer-profile.entity";
import { Specialization } from "../../../specializations/entities/specialization.entity";
import { TRAINER_PROFILES_SEED } from "../data/users.seed";

export class TrainerProfilesSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);
    const profileRepository = this.dataSource.getRepository(TrainerProfile);
    const specializationRepository = this.dataSource.getRepository(Specialization);

    console.log("🌱 Seeding trainer profiles...");

    for (const profileData of TRAINER_PROFILES_SEED) {
      // Find trainer user
      const trainer = await userRepository.findOne({
        where: { email: profileData.trainerEmail, role: UserRole.TRAINER },
      });

      if (!trainer) {
        console.log(`  ⚠️  Trainer not found: ${profileData.trainerEmail}`);
        continue;
      }

      // Check if profile already exists
      const existingProfile = await profileRepository.findOne({
        where: { userId: trainer.id },
      });

      if (existingProfile) {
        console.log(`  ⏭️  Trainer profile already exists for: ${profileData.trainerEmail}`);
        continue;
      }

      // Find specializations
      const specializations: Specialization[] = [];
      for (const specName of profileData.specializationNames) {
        const spec = await specializationRepository.findOne({
          where: { name: specName },
        });
        if (spec) {
          specializations.push(spec);
        } else {
          console.log(`  ⚠️  Specialization not found: ${specName}`);
        }
      }

      // Create trainer profile
      const profile = profileRepository.create({
        userId: trainer.id,
        description: profileData.description,
        city: profileData.city,
        specializations,
      });

      await profileRepository.save(profile);
      console.log(`  ✅ Created trainer profile for: ${profileData.trainerEmail}`);
    }

    console.log(`✅ Trainer profiles seeding completed`);
  }
}
