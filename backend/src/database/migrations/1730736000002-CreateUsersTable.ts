import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Users Table
 *
 * Creates the core users table with:
 * - UUID primary key
 * - Authentication fields (email, password)
 * - Role field using user_role ENUM
 * - Soft delete support (deletedAt)
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * Indexes:
 * - email (for login lookups)
 * - role (for role-based queries)
 */
export class CreateUsersTable1730736000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'CLIENT',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create index on email for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users"("email")
    `);

    // Create index on role for role-based queries
    await queryRunner.query(`
      CREATE INDEX "idx_users_role" ON "users"("role")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
