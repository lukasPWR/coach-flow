import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Trainer Profiles Table
 *
 * Creates the trainer_profiles table with extended information for trainers.
 * Has a 1-to-1 relationship with users table.
 *
 * Fields:
 * - description: Text description of the trainer
 * - city: Location where trainer operates
 * - profilePictureUrl: URL to profile picture
 * - userId: Foreign key to users table (UNIQUE for 1-to-1 relationship)
 *
 * Also creates the trainer_specializations join table for many-to-many
 * relationship between trainers and specializations.
 */
export class CreateTrainerProfilesTable1730736000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create trainer_profiles table
    await queryRunner.query(`
      CREATE TABLE "trainer_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "description" TEXT,
        "city" VARCHAR(255),
        "profilePictureUrl" VARCHAR(500),
        "userId" UUID NOT NULL UNIQUE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_trainer_profiles_user_id" ON "trainer_profiles"("userId")
    `);

    // Create trainer_specializations join table (many-to-many)
    await queryRunner.query(`
      CREATE TABLE "trainer_specializations" (
        "trainerId" UUID NOT NULL,
        "specializationId" UUID NOT NULL,
        PRIMARY KEY ("trainerId", "specializationId")
      )
    `);

    // Add foreign key constraint: trainer_profiles.userId -> users.id
    await queryRunner.query(`
      ALTER TABLE "trainer_profiles"
      ADD CONSTRAINT "fk_trainer_profiles_user_id"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Add foreign key constraints for trainer_specializations
    await queryRunner.query(`
      ALTER TABLE "trainer_specializations"
      ADD CONSTRAINT "fk_trainer_specializations_trainer_id"
      FOREIGN KEY ("trainerId")
      REFERENCES "trainer_profiles"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "trainer_specializations"
      ADD CONSTRAINT "fk_trainer_specializations_specialization_id"
      FOREIGN KEY ("specializationId")
      REFERENCES "specializations"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints from trainer_specializations
    await queryRunner.query(`
      ALTER TABLE "trainer_specializations"
      DROP CONSTRAINT IF EXISTS "fk_trainer_specializations_specialization_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "trainer_specializations"
      DROP CONSTRAINT IF EXISTS "fk_trainer_specializations_trainer_id"
    `);

    // Drop foreign key constraint from trainer_profiles
    await queryRunner.query(`
      ALTER TABLE "trainer_profiles"
      DROP CONSTRAINT IF EXISTS "fk_trainer_profiles_user_id"
    `);

    // Drop join table
    await queryRunner.query(`DROP TABLE IF EXISTS "trainer_specializations"`);

    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_trainer_profiles_user_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "trainer_profiles"`);
  }
}
