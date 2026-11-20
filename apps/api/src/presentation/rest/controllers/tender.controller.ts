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
  @UsePipes(new ZodValidationPipe(createTenderSchema))
  async create(
    @Body() body: CreateTenderInput,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.createDraftTenderUseCase.execute(body, user.sub);
  }

  @Get('my-tenders')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
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
  async getById(@Param('id') id: string): Promise<TenderDto> {
    return this.getTenderDetailsUseCase.execute(id);
  }

  @Put(':id')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
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
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.publishTenderUseCase.execute(id, user.sub);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.cancelTenderUseCase.execute(id, user.sub);
  }
}
