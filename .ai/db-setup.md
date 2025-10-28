# Database Setup - CoachFlow Backend

This document describes the database configuration for the CoachFlow project using PostgreSQL and TypeORM.

## Configuration Overview

- **Database Type**: PostgreSQL
- **ORM**: TypeORM
- **Database Name**: CoachFlow_DEV
- **Default Port**: 5432

## Files Created/Modified

### Backend Files

1. **`src/database/database.module.ts`** - Main database module with TypeORM configuration
2. **`src/database/data-source.ts`** - TypeORM CLI data source for migrations
3. **`src/database/migrations/`** - Directory for database migrations
4. **`src/app.module.ts`** - Updated with ConfigModule and DatabaseModule imports
5. **`src/main.ts`** - Added transactional context initialization
6. **`.env.dev`** - Environment variables for development

### Docker Files

1. **`backend/docker/postgres/init.sql`** - Database initialization script
2. **`backend/docker/postgres/.env`** - Docker environment variables
3. **`docker-compose.yml`** - Docker Compose configuration with PostgreSQL and configurator services

### Configuration Files

1. **`backend/.env`** - Backend environment variables
2. **`package.json`** - Added TypeORM migration scripts

## Installed Dependencies

```bash
npm install @nestjs/typeorm typeorm pg @nestjs/config typeorm-transactional dotenv
```

## Environment Variables

### Backend Environment Variables (`backend/.env`):

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1StrongPwd!
DB_DATABASE=CoachFlow_DEV
NODE_ENV=development
PORT=3000
```

### Docker Environment Variables (`backend/docker/postgres/.env`):

```
DATABASE=CoachFlow_DEV
DB_HOST=localhost
DB_PASSWORD=1StrongPwd!
DB_PORT=5432
DB_USERNAME=postgres
```

**Note:** Use `DB_` prefix for all environment variables to avoid conflicts with system variables like `USERNAME` on Windows.

## Available NPM Scripts

```json
{
  "typeorm": "npm run build && npx typeorm -d dist/database/data-source.js",
  "migration:generate": "npm run typeorm -- migration:generate",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert"
}
```

## Usage

### 1. Start Docker PostgreSQL

```bash
docker-compose up -d
```

This will:

- Start PostgreSQL container on port 5432
- Create the `CoachFlow_DEV` database automatically
- Set up health checks and proper initialization

### 2. Generate a Migration

```bash
npm run migration:generate -- src/database/migrations/InitialMigration
```

### 3. Run Migrations

```bash
npm run migration:run
```

### 4. Revert Last Migration

```bash
npm run migration:revert
```

## Docker Services

### postgres

- PostgreSQL 16 Alpine
- Port: 5432
- Health check enabled
- Persistent volume: `postgres_data`

### configurator

- Waits for PostgreSQL to be healthy
- Ensures proper database initialization
- Runs after main database service is ready

## Notes

- `synchronize` is set to `false` in production mode - always use migrations
- `autoLoadEntities` is enabled to automatically load all entity files
- Transactional context is initialized in `main.ts` for `typeorm-transactional` support
- Logging is enabled in development mode
