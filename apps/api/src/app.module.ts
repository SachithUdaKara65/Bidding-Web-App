import { Module } from "@nestjs/common";
import { HealthController } from "./presentation/rest/controllers/health.controller";

@Module({
  controllers: [HealthController],
})
export class AppModule {}