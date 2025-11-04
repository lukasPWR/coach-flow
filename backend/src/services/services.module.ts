import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Service } from "./entities/service.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [],
  providers: [],
})
export class ServicesModule {}
