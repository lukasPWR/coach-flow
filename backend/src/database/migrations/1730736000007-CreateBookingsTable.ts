import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Bookings Table
 *
 * Creates the bookings table for managing training session reservations.
 *
 * Fields:
 * - startTime: Booking start time (TIMESTAMPTZ)
 * - endTime: Booking end time (TIMESTAMPTZ)
 * - status: Booking status using booking_status ENUM
 * - reminderSentAt: Timestamp when reminder was sent (nullable)
 * - clientId: Foreign key to users (client)
 * - trainerId: Foreign key to users (trainer)
 * - serviceId: Foreign key to services
 *
 * Indexes:
 * - clientId (for client's bookings)
 * - trainerId (for trainer's bookings)
 * - startTime (for time-based queries and calendar views)
 */
export class CreateBookingsTable1730736000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "booking_status" NOT NULL DEFAULT 'PENDING',
        "reminderSentAt" TIMESTAMP WITH TIME ZONE,
        "clientId" UUID NOT NULL,
        "trainerId" UUID NOT NULL,
        "serviceId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create index on clientId for client's booking queries
    await queryRunner.query(`
      CREATE INDEX "idx_bookings_client_id" ON "bookings"("clientId")
    `);

    // Create index on trainerId for trainer's booking queries
    await queryRunner.query(`
      CREATE INDEX "idx_bookings_trainer_id" ON "bookings"("trainerId")
    `);

    // Create index on startTime for time-based queries and calendar views
    await queryRunner.query(`
      CREATE INDEX "idx_bookings_start_time" ON "bookings"("startTime")
    `);

    // Add foreign key constraint: bookings.clientId -> users.id
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_bookings_client_id"
      FOREIGN KEY ("clientId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Add foreign key constraint: bookings.trainerId -> users.id
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_bookings_trainer_id"
      FOREIGN KEY ("trainerId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Add foreign key constraint: bookings.serviceId -> services.id
    // Using RESTRICT to prevent deletion of services that have bookings
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "fk_bookings_service_id"
      FOREIGN KEY ("serviceId")
      REFERENCES "services"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "fk_bookings_service_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "fk_bookings_trainer_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "fk_bookings_client_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bookings_start_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bookings_trainer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bookings_client_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
  }
}
