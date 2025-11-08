import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceType } from "./entities/service-type.entity";
import { Service } from "../services/entities/service.entity";
import { ServiceTypesController } from "./service-types.controller";
import { ServiceTypesService } from "./service-types.service";

@Module({
  imports: [TypeOrmModule.forFeature([ServiceType, Service])],
  controllers: [ServiceTypesController],
  providers: [ServiceTypesService],
  exports: [ServiceTypesService],
})
export class ServiceTypesModule {}
