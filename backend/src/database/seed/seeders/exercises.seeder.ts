import { DataSource } from "typeorm";
import { Exercise } from "../../../exercises/entities/exercise.entity";
import { EXERCISES_SEED } from "../data/exercises.seed";

export class ExercisesSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const repository = this.dataSource.getRepository(Exercise);

    console.log("🌱 Seeding system exercises...");

    let created = 0;
    let skipped = 0;

    for (const exerciseData of EXERCISES_SEED) {
      const existing = await repository.findOne({
        where: {
          name: exerciseData.name,
          isSystem: true,
        },
      });

      if (!existing) {
        const exercise = repository.create(exerciseData);
        await repository.save(exercise);
        created++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Exercises seeding completed: ${created} created, ${skipped} skipped`);
  }
}
