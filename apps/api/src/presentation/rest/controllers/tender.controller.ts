import {
  Controller,
  Post,
  Get,
  Put,
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
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateDraftTenderUseCase } from '../../../application/use-cases/tenders/create-draft-tender.use-case';
import { UpdateDraftTenderUseCase } from '../../../application/use-cases/tenders/update-draft-tender.use-case';
import { PublishTenderUseCase } from '../../../application/use-cases/tenders/publish-tender.use-case';
import { CancelTenderUseCase } from '../../../application/use-cases/tenders/cancel-tender.use-case';
import { GetBuyerTendersUseCase } from '../../../application/use-cases/tenders/get-buyer-tenders.use-case';
import { GetTenderDetailsUseCase } from '../../../application/use-cases/tenders/get-tender-details.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  createTenderSchema,
  updateTenderSchema,
  CreateTenderInput,
  UpdateTenderInput,
} from '@procurement/shared-validation';
import { TenderDto, UserRole, JwtPayload, TenderStatus } from '@procurement/shared-types';

@ApiTags('Tenders')
@ApiBearerAuth('JWT-auth')
@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenderController {
  constructor(
    private readonly createDraftTenderUseCase: CreateDraftTenderUseCase,
    private readonly updateDraftTenderUseCase: UpdateDraftTenderUseCase,
    private readonly publishTenderUseCase: PublishTenderUseCase,
    private readonly cancelTenderUseCase: CancelTenderUseCase,
    private readonly getBuyerTendersUseCase: GetBuyerTendersUseCase,
    private readonly getTenderDetailsUseCase: GetTenderDetailsUseCase
  ) {}

  @Post()
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new procurement tender in DRAFT status (Buyers only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'category', 'submissionDeadline', 'openingDate', 'buyerOrgId'],
      properties: {
        title: { type: 'string', example: 'Enterprise Cloud Infrastructure Services 2026' },
        description: { type: 'string', example: 'Procurement of dedicated multi-region cloud hosting and SLA services.' },
        category: { type: 'string', example: 'Cloud Services' },
        estimatedBudget: { type: 'number', example: 500000 },
        submissionDeadline: { type: 'string', example: new Date(Date.now() + 7 * 86400000).toISOString() },
        openingDate: { type: 'string', example: new Date(Date.now() + 8 * 86400000).toISOString() },
        buyerOrgId: { type: 'string', example: 'your-buyer-org-uuid' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Draft tender created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or deadline is invalid' })
  @ApiResponse({ status: 403, description: 'Not authorized for this buyer organization' })
  @UsePipes(new ZodValidationPipe(createTenderSchema))
  async create(
    @Body() body: CreateTenderInput,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.createDraftTenderUseCase.execute(body, user.sub);
  }

  @Get('my-tenders')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all tenders for a buyer organization' })
  @ApiQuery({ name: 'buyerOrgId', required: true, description: 'UUID of the buyer organization' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'OPEN_FOR_BIDDING', 'CLOSED', 'UNDER_EVALUATION', 'AWARDED', 'CANCELLED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of buyer tenders' })
  async getMyTenders(
    @Query('buyerOrgId') buyerOrgId: string,
    @Query('status') status: TenderStatus | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @CurrentUser() user: JwtPayload
  ): Promise<{ tenders: TenderDto[]; total: number }> {
    return this.getBuyerTendersUseCase.execute(buyerOrgId, user.sub, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve full tender details including buyer organization and documents' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Tender details' })
  @ApiResponse({ status: 404, description: 'Tender not found' })
  async getById(@Param('id') id: string): Promise<TenderDto> {
    return this.getTenderDetailsUseCase.execute(id);
  }

  @Put(':id')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tender details (Allowed only while status is DRAFT)' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Tender Title' },
        description: { type: 'string', example: 'Updated detailed tender description here.' },
        estimatedBudget: { type: 'number', example: 550000 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tender updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot edit tender after it has been published' })
  @UsePipes(new ZodValidationPipe(updateTenderSchema))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTenderInput,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.updateDraftTenderUseCase.execute(id, body, user.sub);
  }

  @Patch(':id/publish')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish draft tender to OPEN_FOR_BIDDING status' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Tender published and open for bids' })
  @ApiResponse({ status: 400, description: 'Tender not in DRAFT or deadline has passed' })
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.publishTenderUseCase.execute(id, user.sub);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an active or draft tender' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Tender status set to CANCELLED' })
  @ApiResponse({ status: 400, description: 'Cannot cancel an awarded or completed tender' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.cancelTenderUseCase.execute(id, user.sub);
  }
}
