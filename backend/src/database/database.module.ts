import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CreateEnums1730736000001 } from "./migrations/1730736000001-CreateEnums";
import { CreateUsersTable1730736000002 } from "./migrations/1730736000002-CreateUsersTable";
import { CreateServiceTypesTable1730736000005 } from "./migrations/1730736000005-CreateServiceTypesTable";
import { CreateServicesTable1730736000006 } from "./migrations/1730736000006-CreateServicesTable";
import { CreateBookingsTable1730736000007 } from "./migrations/1730736000007-CreateBookingsTable";
import { CreateBookingBansTable1730736000009 } from "./migrations/1730736000009-CreateBookingBansTable";
import { CreateUnavailabilitiesTable1730736000008 } from "./migrations/1730736000008-CreateUnavailabilitiesTable";
import { CreateSpecializationsTable1730736000003 } from "./migrations/1730736000003-CreateSpecializationsTable";
import { CreateTrainerProfilesTable1730736000004 } from "./migrations/1730736000004-CreateTrainerProfilesTable";
import { CreateTokenTables1731687000000 } from "./migrations/1731687000000-CreateTokenTables";
import { CreateTrainingPlansModule1737158400000 } from "./migrations/1737158400000-CreateTrainingPlansModule";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_DATABASE"),
        entities: [],
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>("NODE_ENV") === "development",
        migrations: [
          CreateEnums1730736000001,
          CreateUsersTable1730736000002,
          CreateSpecializationsTable1730736000003,
          CreateTrainerProfilesTable1730736000004,
          CreateServiceTypesTable1730736000005,
          CreateServicesTable1730736000006,
          CreateBookingsTable1730736000007,
          CreateUnavailabilitiesTable1730736000008,
          CreateBookingBansTable1730736000009,
          CreateTokenTables1731687000000,
          CreateTrainingPlansModule1737158400000,
        ],
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
