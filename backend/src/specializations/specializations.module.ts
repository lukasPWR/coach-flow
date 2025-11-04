import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Specialization } from "./entities/specialization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Specialization])],
  controllers: [],
  providers: [],
})
export class SpecializationsModule {}
