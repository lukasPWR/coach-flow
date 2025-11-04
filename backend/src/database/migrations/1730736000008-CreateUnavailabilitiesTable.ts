import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Unavailabilities Table
 * 
 * Creates the unavailabilities table for managing trainer unavailable time blocks.
 * Trainers can define periods when they are not available for bookings.
 * 
 * Fields:
 * - startTime: Start of unavailable period (TIMESTAMPTZ)
 * - endTime: End of unavailable period (TIMESTAMPTZ)
 * - trainerId: Foreign key to users (trainer)
 * 
 * Indexes:
 * - Composite index on (trainerId, startTime) for efficient queries
 *   when checking trainer availability
 */
export class CreateUnavailabilitiesTable1730736000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create unavailabilities table
    await queryRunner.query(`
      CREATE TABLE "unavailabilities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "trainerId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create composite index on trainerId and startTime for efficient availability queries
    await queryRunner.query(`
      CREATE INDEX "idx_unavailabilities_trainer_id_start_time" 
      ON "unavailabilities"("trainerId", "startTime")
    `);

    // Add foreign key constraint: unavailabilities.trainerId -> users.id
    await queryRunner.query(`
      ALTER TABLE "unavailabilities"
      ADD CONSTRAINT "fk_unavailabilities_trainer_id"
      FOREIGN KEY ("trainerId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "unavailabilities"
      DROP CONSTRAINT IF EXISTS "fk_unavailabilities_trainer_id"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_unavailabilities_trainer_id_start_time"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "unavailabilities"`);
  }
}

