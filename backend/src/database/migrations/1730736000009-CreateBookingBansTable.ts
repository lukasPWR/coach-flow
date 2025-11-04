import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Booking Bans Table
 *
 * Creates the booking_bans table for managing client booking restrictions.
 * Trainers can temporarily ban clients from making new bookings.
 *
 * Fields:
 * - bannedUntil: Timestamp until when the ban is active (TIMESTAMPTZ)
 * - clientId: Foreign key to users (client who is banned)
 * - trainerId: Foreign key to users (trainer who issued the ban)
 *
 * Indexes:
 * - Composite index on (clientId, trainerId) for checking if a client
 *   is banned from booking with a specific trainer
 */
export class CreateBookingBansTable1730736000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create booking_bans table
    await queryRunner.query(`
      CREATE TABLE "booking_bans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bannedUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
        "clientId" UUID NOT NULL,
        "trainerId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create composite index on clientId and trainerId for ban checking
    await queryRunner.query(`
      CREATE INDEX "idx_booking_bans_client_trainer" 
      ON "booking_bans"("clientId", "trainerId")
    `);

    // Add foreign key constraint: booking_bans.clientId -> users.id
    await queryRunner.query(`
      ALTER TABLE "booking_bans"
      ADD CONSTRAINT "fk_booking_bans_client_id"
      FOREIGN KEY ("clientId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // Add foreign key constraint: booking_bans.trainerId -> users.id
    await queryRunner.query(`
      ALTER TABLE "booking_bans"
      ADD CONSTRAINT "fk_booking_bans_trainer_id"
      FOREIGN KEY ("trainerId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "booking_bans"
      DROP CONSTRAINT IF EXISTS "fk_booking_bans_trainer_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_bans"
      DROP CONSTRAINT IF EXISTS "fk_booking_bans_client_id"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_booking_bans_client_trainer"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_bans"`);
  }
}
