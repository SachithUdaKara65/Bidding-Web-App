import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { GetPlatformStatsUseCase } from '../../../application/use-cases/admin/get-platform-stats.use-case';
import { GetAdminUsersUseCase } from '../../../application/use-cases/admin/get-admin-users.use-case';
import { UpdateUserStatusUseCase } from '../../../application/use-cases/admin/update-user-status.use-case';
import { GetAuditLogsUseCase } from '../../../application/use-cases/admin/get-audit-logs.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  updateUserStatusSchema,
  UpdateUserStatusInput,
} from '@procurement/shared-validation';
import {
  PlatformStatsDto,
  UserDto,
  UserRole,
  UserStatus,
  AuditLogDto,
  JwtPayload,
} from '@procurement/shared-types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private readonly getPlatformStatsUseCase: GetPlatformStatsUseCase,
    private readonly getAdminUsersUseCase: GetAdminUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Retrieve high-level platform statistics and metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Platform metrics including tender, bid, user, and award counts' })
  async getStats(): Promise<PlatformStatsDto> {
    return this.getPlatformStatsUseCase.execute();
  }

  @Get('users')
  @ApiOperation({ summary: 'List and filter platform users with pagination (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: [UserRole.BUYER, UserRole.BIDDER, UserRole.ADMIN] })
  @ApiQuery({ name: 'status', required: false, enum: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async getUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<{ users: UserDto[]; total: number }> {
    return this.getAdminUsersUseCase.execute({
      role,
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user account status: activate, deactivate, or suspend (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UsePipes(new ZodValidationPipe(updateUserStatusSchema))
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusInput,
    @CurrentUser() adminUser: JwtPayload
  ): Promise<UserDto> {
    return this.updateUserStatusUseCase.execute(id, body.status, adminUser.sub);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Query immutable system audit log entries (Admin only)' })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<{ logs: AuditLogDto[]; total: number }> {
    return this.getAuditLogsUseCase.execute({
      action,
      resource,
      userId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
