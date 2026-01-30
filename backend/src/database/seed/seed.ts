import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables
config({ path: join(__dirname, "..", "..", "..", ".env") });

// Import seeders
import { ServiceTypesSeeder } from "./seeders/service-types.seeder";
import { SpecializationsSeeder } from "./seeders/specializations.seeder";
import { ExercisesSeeder } from "./seeders/exercises.seeder";
import { UsersSeeder } from "./seeders/users.seeder";
import { TrainerProfilesSeeder } from "./seeders/trainer-profiles.seeder";
import { ServicesSeeder } from "./seeders/services.seeder";

// Import entities
import { User } from "../../users/entities/user.entity";
import { ServiceType } from "../../service-types/entities/service-type.entity";
import { Specialization } from "../../specializations/entities/specialization.entity";
import { Exercise } from "../../exercises/entities/exercise.entity";
import { TrainerProfile } from "../../trainer-profiles/entities/trainer-profile.entity";
import { Service } from "../../services/entities/service.entity";
import { Booking } from "../../bookings/entities/booking.entity";
import { Unavailability } from "../../unavailabilities/entities/unavailability.entity";
import { BookingBan } from "../../booking-bans/entities/booking-ban.entity";
import { RefreshToken } from "../../tokens/entities/refresh-token.entity";
import { PasswordResetToken } from "../../tokens/entities/password-reset-token.entity";
import { TrainingPlan } from "../../training-plans/entities/training-plan.entity";
import { TrainingUnit } from "../../training-units/entities/training-unit.entity";
import { PlanExercise } from "../../plan-exercises/entities/plan-exercise.entity";

/**
 * Create a new DataSource for seeding
 */
const createDataSource = (): DataSource => {
  return new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "1StrongPwd!",
    database: process.env.DB_DATABASE || "CoachFlow_DEV",
    entities: [
      User,
      ServiceType,
      Specialization,
      Exercise,
      TrainerProfile,
      Service,
      Booking,
      Unavailability,
      BookingBan,
      RefreshToken,
      PasswordResetToken,
      TrainingPlan,
      TrainingUnit,
      PlanExercise,
    ],
    synchronize: false,
    logging: false,
  });
};

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  console.log("🚀 Starting database seeding...\n");

  const dataSource = createDataSource();

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log("📦 Database connection established\n");

    // Run seeders in order (respecting foreign key dependencies)
    // Level 1: No dependencies
    const serviceTypesSeeder = new ServiceTypesSeeder(dataSource);
    await serviceTypesSeeder.run();
    console.log("");

    const specializationsSeeder = new SpecializationsSeeder(dataSource);
    await specializationsSeeder.run();
    console.log("");

    const exercisesSeeder = new ExercisesSeeder(dataSource);
    await exercisesSeeder.run();
    console.log("");

    // Level 2: Depends on nothing
    const usersSeeder = new UsersSeeder(dataSource);
    await usersSeeder.run();
    console.log("");

    // Level 3: Depends on users and specializations
    const trainerProfilesSeeder = new TrainerProfilesSeeder(dataSource);
    await trainerProfilesSeeder.run();
    console.log("");

    // Level 4: Depends on users and service_types
    const servicesSeeder = new ServicesSeeder(dataSource);
    await servicesSeeder.run();
    console.log("");

    console.log("🎉 Database seeding completed successfully!\n");
    console.log("📋 Demo accounts:");
    console.log("   Admin:   admin@coachflow.pl   / Admin123!");
    console.log("   Trainer: trener@coachflow.pl  / Trener123!");
    console.log("   Client:  klient@coachflow.pl  / Klient123!");
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("📦 Database connection closed");
    }
  }
}

// Run seed
seed();
