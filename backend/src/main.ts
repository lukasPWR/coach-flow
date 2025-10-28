import { NestFactory } from "@nestjs/core";
import { initializeTransactionalContext } from "typeorm-transactional";
import { AppModule } from "./app.module";

// Initialize transactional context for TypeORM
initializeTransactionalContext();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
