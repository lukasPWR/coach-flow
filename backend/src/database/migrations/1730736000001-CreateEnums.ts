import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create ENUM Types
 *
 * Creates PostgreSQL ENUM types used across the application:
 * - user_role: Defines user roles (CLIENT, TRAINER, ADMIN)
 * - booking_status: Defines booking statuses (PENDING, CONFIRMED, CANCELLED, COMPLETED)
 *
 * This migration must run first as these ENUMs are referenced by other tables.
 */
export class CreateEnums1730736000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_role ENUM
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('CLIENT', 'TRAINER', 'ADMIN')
    `);

    // Create booking_status ENUM
    await queryRunner.query(`
      CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop ENUMs in reverse order
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
