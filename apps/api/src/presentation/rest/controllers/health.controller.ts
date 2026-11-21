import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API service health status" })
  @ApiResponse({ status: 200, description: "API service is healthy and operational" })
  getHealth() {
    return { status: "ok", service: "procurement-api" };
  }
}
