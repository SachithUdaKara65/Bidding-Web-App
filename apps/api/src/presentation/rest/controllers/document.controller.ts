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
import { GenerateUploadUrlUseCase } from '../../../application/use-cases/documents/generate-upload-url.use-case';
import { GenerateDownloadUrlUseCase } from '../../../application/use-cases/documents/generate-download-url.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { generateUploadUrlSchema, GenerateUploadUrlInput } from '@procurement/shared-validation';
import {
  UploadUrlResponseDto,
  DownloadUrlResponseDto,
  JwtPayload,
} from '@procurement/shared-types';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly generateDownloadUrlUseCase: GenerateDownloadUrlUseCase
  ) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate a short-lived pre-signed URL for direct upload to Supabase Storage',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['bucket', 'fileName', 'fileType', 'fileSize'],
      properties: {
        bucket: {
          type: 'string',
          enum: ['tender-documents', 'bid-submissions'],
          example: 'tender-documents',
        },
        fileName: { type: 'string', example: 'technical_specifications.pdf' },
        fileType: { type: 'string', example: 'application/pdf' },
        fileSize: { type: 'number', example: 1048576 },
        tenderId: { type: 'string', format: 'uuid', example: 'tender-uuid-here' },
        bidId: { type: 'string', format: 'uuid', example: 'bid-uuid-here' },
        documentType: { type: 'string', example: 'TECHNICAL_SPEC' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Pre-signed upload URL created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or upload past deadline' })
  @ApiResponse({ status: 403, description: 'Forbidden: not authorized for target tender/bid' })
  @UsePipes(new ZodValidationPipe(generateUploadUrlSchema))
  async getUploadUrl(
    @Body() body: GenerateUploadUrlInput,
    @CurrentUser() user: JwtPayload
  ): Promise<UploadUrlResponseDto> {
    return this.generateUploadUrlUseCase.execute(body, user);
  }

  @Get(':id/download-url')
  @ApiOperation({
    summary: 'Generate a secure time-bounded pre-signed download URL for a document',
  })
  @ApiParam({ name: 'id', description: 'Document UUID (TenderDocument or BidDocument)' })
  @ApiResponse({ status: 200, description: 'Pre-signed download URL generated' })
  @ApiResponse({ status: 403, description: 'Access forbidden (e.g. competitor trying to download sealed bid doc)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<DownloadUrlResponseDto> {
    return this.generateDownloadUrlUseCase.execute(id, user);
  }
}
