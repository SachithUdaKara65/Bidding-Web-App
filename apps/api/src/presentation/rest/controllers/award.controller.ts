import {
  Controller,
  Post,
  Get,
  Param,
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
  ApiBody,
} from '@nestjs/swagger';
import { OpenTenderBidsUseCase } from '../../../application/use-cases/tenders/open-tender-bids.use-case';
import { GetOpenedTenderBidsUseCase } from '../../../application/use-cases/tenders/get-opened-tender-bids.use-case';
import { AwardTenderUseCase } from '../../../application/use-cases/tenders/award-tender.use-case';
import { GetTenderAwardUseCase } from '../../../application/use-cases/tenders/get-tender-award.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { awardTenderSchema, AwardTenderInput } from '@procurement/shared-validation';
import {
  TenderDto,
  BidDto,
  TenderAwardDto,
  UserRole,
  JwtPayload,
} from '@procurement/shared-types';

@ApiTags('Tender Award & Opening')
@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AwardController {
  constructor(
    private readonly openTenderBidsUseCase: OpenTenderBidsUseCase,
    private readonly getOpenedTenderBidsUseCase: GetOpenedTenderBidsUseCase,
    private readonly awardTenderUseCase: AwardTenderUseCase,
    private readonly getTenderAwardUseCase: GetTenderAwardUseCase
  ) {}

  @Post(':id/open-bids')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Officially open sealed bids after submission deadline — transitions tender to UNDER_EVALUATION and unseals all bids' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 201, description: 'Bids opened successfully; tender is now UNDER_EVALUATION' })
  @ApiResponse({ status: 400, description: 'Submission deadline has not passed yet or tender is in wrong status' })
  @ApiResponse({ status: 403, description: 'Only the buyer organization can open bids' })
  async openBids(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderDto> {
    return this.openTenderBidsUseCase.execute(id, user);
  }

  @Get(':id/bids')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all opened (unsealed) bids for a tender — only accessible after official bid opening' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Full list of unsealed bids with proposals and financial amounts' })
  @ApiResponse({ status: 403, description: 'Bids not yet opened or insufficient permissions' })
  async getOpenedBids(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<BidDto[]> {
    return this.getOpenedTenderBidsUseCase.execute(id, user);
  }

  @Post(':id/award')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Award the tender to the winning bid — transitions to AWARDED, sets winning bid to ACCEPTED, all others REJECTED' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['winningBidId'],
      properties: {
        winningBidId: { type: 'string', format: 'uuid', example: 'bid-uuid-here' },
        awardNotes: { type: 'string', example: 'Alpha Solutions Ltd selected based on best value-for-money score.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tender awarded; award record created with winning bid details' })
  @ApiResponse({ status: 400, description: 'Tender not UNDER_EVALUATION or winning bid was withdrawn' })
  @ApiResponse({ status: 403, description: 'Only the buyer organization can award this tender' })
  @ApiResponse({ status: 404, description: 'Winning bid not found on this tender' })
  @UsePipes(new ZodValidationPipe(awardTenderSchema))
  async awardTender(
    @Param('id') id: string,
    @Body() body: AwardTenderInput,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderAwardDto> {
    return this.awardTenderUseCase.execute(id, body, user);
  }

  @Get(':id/award')
  @ApiOperation({ summary: 'Retrieve the award decision and winning bid details for an awarded tender' })
  @ApiParam({ name: 'id', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Award details including winning vendor and bid information' })
  @ApiResponse({ status: 404, description: 'Tender not awarded yet or not found' })
  async getAward(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderAwardDto> {
    return this.getTenderAwardUseCase.execute(id, user);
  }
}
