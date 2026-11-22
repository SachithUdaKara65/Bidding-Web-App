import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GetMyBidsUseCase } from '../../../application/use-cases/bids/get-my-bids.use-case';
import { GetBidDetailsUseCase } from '../../../application/use-cases/bids/get-bid-details.use-case';
import { WithdrawBidUseCase } from '../../../application/use-cases/bids/withdraw-bid.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  BidDto,
  MaskedBidDto,
  UserRole,
  JwtPayload,
} from '@procurement/shared-types';

@ApiTags('Bids')
@Controller('bids')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BidController {
  constructor(
    private readonly getMyBidsUseCase: GetMyBidsUseCase,
    private readonly getBidDetailsUseCase: GetBidDetailsUseCase,
    private readonly withdrawBidUseCase: WithdrawBidUseCase
  ) {}

  @Get('my-bids')
  @Roles(UserRole.BIDDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve all bids submitted by the current user or their vendor organizations' })
  @ApiResponse({ status: 200, description: 'List of submitted bids' })
  async getMyBids(@CurrentUser() user: JwtPayload): Promise<BidDto[]> {
    return this.getMyBidsUseCase.execute(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve bid details with strict sealed bidding privacy protection' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid details (masked if sealed and queried by buyer; full if owner/admin)' })
  @ApiResponse({ status: 403, description: 'Access forbidden (e.g. competitor bidder trying to view bid)' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<BidDto | MaskedBidDto> {
    return this.getBidDetailsUseCase.execute(id, user);
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.BIDDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Withdraw a submitted bid prior to the tender submission deadline' })
  @ApiParam({ name: 'id', description: 'Bid UUID' })
  @ApiResponse({ status: 200, description: 'Bid status updated to WITHDRAWN' })
  @ApiResponse({ status: 400, description: 'Cannot withdraw after submission deadline or already withdrawn' })
  @ApiResponse({ status: 403, description: 'Forbidden: not authorized to withdraw this bid' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async withdraw(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<BidDto> {
    return this.withdrawBidUseCase.execute(id, user.sub);
  }
}
