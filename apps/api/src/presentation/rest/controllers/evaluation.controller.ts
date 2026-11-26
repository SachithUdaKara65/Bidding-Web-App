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
import { SubmitEvaluationUseCase } from '../../../application/use-cases/bids/submit-evaluation.use-case';
import { GetTenderEvaluationSummaryUseCase } from '../../../application/use-cases/bids/get-tender-evaluation-summary.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { submitEvaluationSchema, SubmitEvaluationInput } from '@procurement/shared-validation';
import {
  BidEvaluationDto,
  TenderEvaluationSummaryDto,
  UserRole,
  JwtPayload,
} from '@procurement/shared-types';

@ApiTags('Evaluations')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EvaluationController {
  constructor(
    private readonly submitEvaluationUseCase: SubmitEvaluationUseCase,
    private readonly getTenderEvaluationSummaryUseCase: GetTenderEvaluationSummaryUseCase
  ) {}

  @Post('bids/:bidId/evaluations')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit a technical and financial evaluation score for an opened bid (Buyer committee members only)' })
  @ApiParam({ name: 'bidId', description: 'Bid UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['technicalScore', 'financialScore'],
      properties: {
        technicalScore: { type: 'number', minimum: 0, maximum: 100, example: 82 },
        financialScore: { type: 'number', minimum: 0, maximum: 100, example: 75 },
        comments: { type: 'string', example: 'Strong technical approach; good price competitiveness.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Evaluation recorded; composite score calculated (60% tech + 40% financial)' })
  @ApiResponse({ status: 400, description: 'Tender is not UNDER_EVALUATION or bid is still sealed' })
  @ApiResponse({ status: 403, description: 'Only buyer organization evaluators can score bids' })
  @ApiResponse({ status: 409, description: 'Evaluator has already submitted a score for this bid' })
  @UsePipes(new ZodValidationPipe(submitEvaluationSchema))
  async submitEvaluation(
    @Param('bidId') bidId: string,
    @Body() body: SubmitEvaluationInput,
    @CurrentUser() user: JwtPayload
  ): Promise<BidEvaluationDto> {
    return this.submitEvaluationUseCase.execute(bidId, body, user);
  }

  @Get('tenders/:tenderId/evaluations')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve ranked bid evaluation summary for a tender (Buyer organization only)' })
  @ApiParam({ name: 'tenderId', description: 'Tender UUID' })
  @ApiResponse({ status: 200, description: 'Evaluation summary with all bids ranked by composite score' })
  @ApiResponse({ status: 403, description: 'Only buyer organization members can view evaluation summaries' })
  @ApiResponse({ status: 400, description: 'Tender bids have not been opened yet' })
  async getEvaluationSummary(
    @Param('tenderId') tenderId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<TenderEvaluationSummaryDto> {
    return this.getTenderEvaluationSummaryUseCase.execute(tenderId, user);
  }
}
