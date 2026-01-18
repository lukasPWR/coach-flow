import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingPlan } from './entities/training-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingPlan])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class TrainingPlansModule {}
