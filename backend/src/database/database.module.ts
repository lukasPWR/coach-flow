import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

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
        migrations: ["dist/database/migrations/*{.js,.ts}"],
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
