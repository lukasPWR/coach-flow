import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../../users/entities/user.entity";
import { USERS_SEED } from "../data/users.seed";

export class UsersSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const repository = this.dataSource.getRepository(User);
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);

    console.log("🌱 Seeding demo users...");

    for (const userData of USERS_SEED) {
      const existing = await repository.findOne({
        where: { email: userData.email },
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        const user = repository.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        });

        await repository.save(user);
        console.log(`  ✅ Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`  ⏭️  User already exists: ${userData.email}`);
      }
    }

    console.log(`✅ Users seeding completed (${USERS_SEED.length} items)`);
  }
}
