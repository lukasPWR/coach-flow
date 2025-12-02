import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Specializations Table
 *
 * Creates the specializations dictionary table for trainer specializations.
 * This is a simple lookup table with unique names.
 *
 * Examples: "Personal Training", "Yoga", "CrossFit", "Nutrition", etc.
 */
export class CreateSpecializationsTable1730736000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create specializations table
    await queryRunner.query(`
      CREATE TABLE "specializations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL UNIQUE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "specializations"`);
  }
}
