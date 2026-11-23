import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  app.setGlobalPrefix("api/v1", {
    exclude: ["health", "docs", "docs-json"],
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle("Procurement & Tender Bidding API")
    .setDescription(
      "REST API documentation for Procurement & Tender Bidding Platform. Provides endpoints for Authentication, Organizations, and Tender Lifecycle Management."
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter your JWT Bearer token here (obtained from /api/v1/auth/login)",
        in: "header",
      },
      "JWT-auth"
    )
    .addTag("Health", "API health check")
    .addTag("Auth", "User registration, login, and token rotation")
    .addTag("Organizations", "Buyer and vendor organization management")
    .addTag("Tenders", "Tender drafting, updating, publishing, and cancellation")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.API_PORT || 3001);
  const host = process.env.API_HOST || "0.0.0.0";
  await app.listen(port, host);
}

void bootstrap();
