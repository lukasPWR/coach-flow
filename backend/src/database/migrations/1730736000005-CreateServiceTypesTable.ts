import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Service Types Table
 * 
 * Creates the service_types dictionary table.
 * This is a simple lookup table with unique names.
 * 
 * Examples: "Personal Training Session", "Group Class", "Online Consultation", etc.
 */
export class CreateServiceTypesTable1730736000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create service_types table
    await queryRunner.query(`
      CREATE TABLE "service_types" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL UNIQUE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "service_types"`);
  }
}

