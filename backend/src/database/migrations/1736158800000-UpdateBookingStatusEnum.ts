import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Update Booking Status ENUM
 *
 * Updates the booking_status ENUM to match the application code:
 * - Replaces 'CONFIRMED' with 'ACCEPTED'
 * - Adds 'REJECTED' status
 * - Removes 'COMPLETED' status
 *
 * This migration handles existing data by converting 'CONFIRMED' to 'ACCEPTED'.
 */
export class UpdateBookingStatusEnum1736158800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the default constraint temporarily
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Step 2: Create a new ENUM with all values (old + new)
    await queryRunner.query(`
      CREATE TYPE "booking_status_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'COMPLETED')
    `);

    // Step 3: Change the column type, converting existing values
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" TYPE "booking_status_new" 
      USING (
        CASE 
          WHEN "status"::text = 'CONFIRMED' THEN 'ACCEPTED'::booking_status_new
          WHEN "status"::text = 'COMPLETED' THEN 'CANCELLED'::booking_status_new
          ELSE "status"::text::booking_status_new
        END
      )
    `);

    // Step 4: Drop the old ENUM
    await queryRunner.query(`DROP TYPE "booking_status"`);

    // Step 5: Rename the new ENUM to the original name
    await queryRunner.query(`ALTER TYPE "booking_status_new" RENAME TO "booking_status"`);

    // Step 6: Create a temporary ENUM with only the final values
    await queryRunner.query(`
      CREATE TYPE "booking_status_final" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')
    `);

    // Step 7: Convert the column to the final ENUM
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" TYPE "booking_status_final" 
      USING "status"::text::booking_status_final
    `);

    // Step 8: Drop the intermediate ENUM
    await queryRunner.query(`DROP TYPE "booking_status"`);

    // Step 9: Rename the final ENUM to the original name
    await queryRunner.query(`ALTER TYPE "booking_status_final" RENAME TO "booking_status"`);

    // Step 10: Restore the default constraint with the new value
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" SET DEFAULT 'PENDING'::booking_status
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop default
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Revert back to original ENUM values
    await queryRunner.query(`
      CREATE TYPE "booking_status_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" TYPE "booking_status_new" 
      USING (
        CASE 
          WHEN "status"::text = 'ACCEPTED' THEN 'CONFIRMED'::booking_status_new
          WHEN "status"::text = 'REJECTED' THEN 'CANCELLED'::booking_status_new
          ELSE "status"::text::booking_status_new
        END
      )
    `);

    await queryRunner.query(`DROP TYPE "booking_status"`);
    await queryRunner.query(`ALTER TYPE "booking_status_new" RENAME TO "booking_status"`);

    // Restore default with old value
    await queryRunner.query(`
      ALTER TABLE "bookings" 
      ALTER COLUMN "status" SET DEFAULT 'PENDING'::booking_status
    `);
  }
}
