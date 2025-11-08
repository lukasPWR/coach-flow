import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { initializeTransactionalContext } from "typeorm-transactional";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from "@nestjs/swagger";

// Initialize transactional context for TypeORM
initializeTransactionalContext();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  // Global validation pipe with strict settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.use(helmet());
  app.enableCors();

  if (process.env.OPEN_API_AVAIBLE) {
    const config = new DocumentBuilder().setTitle("CoachFlow API Docs").setVersion("1.0").addBearerAuth().build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
      customSiteTitle: "CoachFlow API Docs",
    };

    SwaggerModule.setup("api", app, documentFactory, customOptions);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
