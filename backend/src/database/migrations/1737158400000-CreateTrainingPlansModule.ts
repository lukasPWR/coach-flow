import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Training Plans Module
 *
 * Creates the complete training plans module structure including:
 * - pg_trgm extension (for full-text search on exercise names)
 * - muscle_group_type ENUM (14 categories for exercise classification)
 * - plan_status ENUM (ACTIVE, ARCHIVED)
 * - exercises table (central exercise library - system & trainer-owned)
 * - training_plans table (training plan headers for trainer-client assignments)
 * - training_units table (individual training sessions within a plan)
 * - plan_exercises table (specific exercise assignments with parameters)
 *
 * EXECUTION ORDER:
 * 0. Enable pg_trgm extension (required for GIN index on text search)
 * 1. ENUMs (required by table definitions)
 * 2. exercises (base table with no dependencies on other new tables)
 * 3. training_plans (depends on users table, which already exists)
 * 4. training_units (depends on training_plans)
 * 5. plan_exercises (depends on training_units and exercises)
 * 6. Indexes (including GIN index for full-text search)
 * 7. Foreign key constraints
 *
 * INDEXES:
 * - Partial indexes on exercises.trainer_id and exercises.is_system
 * - Standard indexes on foreign keys and frequently queried columns
 * - GIN index on exercises.name for full-text search (uses pg_trgm extension)
 *
 * FOREIGN KEY NOTES:
 * - exercises.trainer_id: NULLABLE, ON DELETE SET NULL (system exercises have NULL)
 * - plan_exercises.exercise_id: NO CASCADE DELETE (preserves plan history even if exercise deleted)
 * - Other FKs: CASCADE DELETE for data consistency
 *
 * SECURITY:
 * - Soft delete support on exercises table (deleted_at column)
 * - RLS policies should be applied separately via application or database policy
 *
 * RISK ASSESSMENT:
 * - LOW RISK: Creates new tables, does not modify existing data
 * - Automatically enables pg_trgm extension if not already present
 */
export class CreateTrainingPlansModule1737158400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // STEP 0: Enable Required PostgreSQL Extensions
    // ========================================

    // Enable pg_trgm extension for full-text search capabilities on exercise names
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm
    `);

    // ========================================
    // STEP 1: Create ENUM Types
    // ========================================

    // Create muscle_group_type ENUM - 14 categories based on actual code
    await queryRunner.query(`
      CREATE TYPE "muscle_group_type" AS ENUM (
        'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS',
        'FOREARMS', 'ABS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES',
        'CALVES', 'FULL_BODY', 'CARDIO', 'OTHER'
      )
    `);

    // Create plan_status ENUM
    await queryRunner.query(`
      CREATE TYPE "plan_status" AS ENUM ('ACTIVE', 'ARCHIVED')
    `);

    // ========================================
    // STEP 2: Create Tables
    // ========================================

    // Create exercises table - central exercise library
    await queryRunner.query(`
      CREATE TABLE "exercises" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "trainer_id" UUID,
        "name" VARCHAR(255) NOT NULL,
        "muscle_group" "muscle_group_type" NOT NULL,
        "is_system" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create training_plans table - plan headers
    await queryRunner.query(`
      CREATE TABLE "training_plans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "trainer_id" UUID NOT NULL,
        "client_id" UUID NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "status" "plan_status" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create training_units table - training sessions within plans
    await queryRunner.query(`
      CREATE TABLE "training_units" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "training_plan_id" UUID NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create plan_exercises table - exercise assignments with parameters
    await queryRunner.query(`
      CREATE TABLE "plan_exercises" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "training_unit_id" UUID NOT NULL,
        "exercise_id" UUID NOT NULL,
        "sets" VARCHAR(50),
        "reps" VARCHAR(50),
        "weight" VARCHAR(50),
        "tempo" VARCHAR(50),
        "rest" VARCHAR(50),
        "notes" TEXT,
        "sort_order" INTEGER NOT NULL DEFAULT 0,
        "is_completed" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // ========================================
    // STEP 3: Create Indexes
    // ========================================

    // Indexes for exercises table
    // Partial index for trainer-owned exercises (excludes system exercises where trainer_id IS NULL)
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_trainer_id" 
      ON "exercises"("trainer_id") 
      WHERE "trainer_id" IS NOT NULL
    `);

    // Partial index for system exercises
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_is_system" 
      ON "exercises"("is_system") 
      WHERE "is_system" = true
    `);

    // Index for muscle group filtering (frequent in UI)
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_muscle_group" 
      ON "exercises"("muscle_group")
    `);

    // GIN index for full-text search on exercise name (uses pg_trgm extension enabled earlier)
    await queryRunner.query(`
      CREATE INDEX "idx_exercises_name_trgm" 
      ON "exercises" 
      USING GIN ("name" gin_trgm_ops)
    `);

    // Indexes for training_plans table
    await queryRunner.query(`
      CREATE INDEX "idx_training_plans_trainer_id" 
      ON "training_plans"("trainer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_training_plans_client_id" 
      ON "training_plans"("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_training_plans_status" 
      ON "training_plans"("status")
    `);

    // Index for training_units table
    await queryRunner.query(`
      CREATE INDEX "idx_training_units_plan_id" 
      ON "training_units"("training_plan_id")
    `);

    // Index for plan_exercises table
    await queryRunner.query(`
      CREATE INDEX "idx_plan_exercises_unit_id" 
      ON "plan_exercises"("training_unit_id")
    `);

    // ========================================
    // STEP 4: Create Foreign Key Constraints
    // ========================================

    // exercises.trainer_id -> users.id
    // NULLABLE: System exercises have trainer_id = NULL
    // ON DELETE SET NULL: If trainer is deleted, exercise becomes orphaned but preserved
    await queryRunner.query(`
      ALTER TABLE "exercises"
      ADD CONSTRAINT "fk_exercises_trainer_id"
      FOREIGN KEY ("trainer_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);

    // training_plans.trainer_id -> users.id
    // CASCADE: If trainer is deleted, their plans are also deleted
    await queryRunner.query(`
      ALTER TABLE "training_plans"
      ADD CONSTRAINT "fk_training_plans_trainer_id"
      FOREIGN KEY ("trainer_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // training_plans.client_id -> users.id
    // CASCADE: If client is deleted, plans assigned to them are also deleted
    await queryRunner.query(`
      ALTER TABLE "training_plans"
      ADD CONSTRAINT "fk_training_plans_client_id"
      FOREIGN KEY ("client_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // training_units.training_plan_id -> training_plans.id
    // CASCADE: If plan is deleted, all units within it are also deleted
    await queryRunner.query(`
      ALTER TABLE "training_units"
      ADD CONSTRAINT "fk_training_units_plan_id"
      FOREIGN KEY ("training_plan_id")
      REFERENCES "training_plans"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // plan_exercises.training_unit_id -> training_units.id
    // CASCADE: If training unit is deleted, all exercises within it are also deleted
    await queryRunner.query(`
      ALTER TABLE "plan_exercises"
      ADD CONSTRAINT "fk_plan_exercises_unit_id"
      FOREIGN KEY ("training_unit_id")
      REFERENCES "training_units"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // plan_exercises.exercise_id -> exercises.id
    // NO CASCADE: Preserves plan history even if exercise definition is deleted
    // Application should handle displaying soft-deleted exercises in existing plans
    await queryRunner.query(`
      ALTER TABLE "plan_exercises"
      ADD CONSTRAINT "fk_plan_exercises_exercise_id"
      FOREIGN KEY ("exercise_id")
      REFERENCES "exercises"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // STEP 1: Drop Foreign Key Constraints
    // ========================================
    // IMPORTANT: Drop in reverse order of dependencies

    await queryRunner.query(`
      ALTER TABLE "plan_exercises"
      DROP CONSTRAINT IF EXISTS "fk_plan_exercises_exercise_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "plan_exercises"
      DROP CONSTRAINT IF EXISTS "fk_plan_exercises_unit_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "training_units"
      DROP CONSTRAINT IF EXISTS "fk_training_units_plan_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "training_plans"
      DROP CONSTRAINT IF EXISTS "fk_training_plans_client_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "training_plans"
      DROP CONSTRAINT IF EXISTS "fk_training_plans_trainer_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "exercises"
      DROP CONSTRAINT IF EXISTS "fk_exercises_trainer_id"
    `);

    // ========================================
    // STEP 2: Drop Indexes
    // ========================================

    // Drop plan_exercises indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_plan_exercises_unit_id"
    `);

    // Drop training_units indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_training_units_plan_id"
    `);

    // Drop training_plans indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_training_plans_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_training_plans_client_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_training_plans_trainer_id"
    `);

    // Drop exercises indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exercises_name_trgm"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exercises_muscle_group"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exercises_is_system"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exercises_trainer_id"
    `);

    // ========================================
    // STEP 3: Drop Tables
    // ========================================
    // IMPORTANT: Drop in reverse order of dependencies

    await queryRunner.query(`
      DROP TABLE IF EXISTS "plan_exercises"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "training_units"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "training_plans"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "exercises"
    `);

    // ========================================
    // STEP 4: Drop ENUM Types
    // ========================================

    await queryRunner.query(`
      DROP TYPE IF EXISTS "plan_status"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "muscle_group_type"
    `);
  }
}
