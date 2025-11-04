import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Unavailability } from "./entities/unavailability.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Unavailability])],
  controllers: [],
  providers: [],
})
export class UnavailabilitiesModule {}
