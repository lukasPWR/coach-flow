import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingUnit } from './entities/training-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingUnit])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class TrainingUnitsModule {}
