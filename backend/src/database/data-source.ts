import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env file
config({ path: join(__dirname, "..", "..", ".env") });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "1StrongPwd!",
  database: process.env.DB_DATABASE || "CoachFlow_DEV",
  entities: ["dist/**/*.entity.js"],
  migrations: ["dist/database/migrations/*{.js,.ts}"],
  synchronize: false,
  logging: true,
});
