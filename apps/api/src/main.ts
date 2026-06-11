import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend interactions
  app.enableCors();

  // Add global route prefix
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(
    `🚀 StellarEvents API is running on: http://localhost:${port}/api`,
  );
}
bootstrap();
