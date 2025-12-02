import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Services Table
 *
 * Creates the services table where trainers define their offered services.
 *
 * Fields:
 * - price: Service price (DECIMAL with CHECK constraint >= 0)
 * - durationMinutes: Duration in minutes (CHECK constraint > 0)
 * - trainerId: Foreign key to users (trainer)
 * - serviceTypeId: Foreign key to service_types
 * - Soft delete support (deletedAt)
 *
 * Indexes:
 * - trainerId (for querying trainer's services)
 * - serviceTypeId (for filtering by service type)
 */
export class CreateServicesTable1730736000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create services table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "price" DECIMAL(10, 2) NOT NULL CHECK ("price" >= 0),
        "durationMinutes" INTEGER NOT NULL CHECK ("durationMinutes" > 0),
        "trainerId" UUID NOT NULL,
        "serviceTypeId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create index on trainerId for faster trainer service lookups
    await queryRunner.query(`
      CREATE INDEX "idx_services_trainer_id" ON "services"("trainerId")
    `);

    // Create index on serviceTypeId for filtering by service type
    await queryRunner.query(`
      CREATE INDEX "idx_services_service_type_id" ON "services"("serviceTypeId")
    `);

    // Add foreign key constraint: services.trainerId -> users.id
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "fk_services_trainer_id"
      FOREIGN KEY ("trainerId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Add foreign key constraint: services.serviceTypeId -> service_types.id
    // Using RESTRICT to prevent deletion of service types that are in use
    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "fk_services_service_type_id"
      FOREIGN KEY ("serviceTypeId")
      REFERENCES "service_types"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "services"
      DROP CONSTRAINT IF EXISTS "fk_services_service_type_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      DROP CONSTRAINT IF EXISTS "fk_services_trainer_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_services_service_type_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_services_trainer_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
  }
}
