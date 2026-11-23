import {
  Controller,
  Post,
  Get,
  Put,
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
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateOrganizationUseCase } from '../../../application/use-cases/organizations/create-organization.use-case';
import { GetOrganizationUseCase } from '../../../application/use-cases/organizations/get-organization.use-case';
import { UpdateOrganizationUseCase } from '../../../application/use-cases/organizations/update-organization.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '@procurement/shared-validation';
import { OrganizationDto, JwtPayload } from '@procurement/shared-types';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new buyer or vendor organization' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'registrationNumber', 'type'],
      properties: {
        name: { type: 'string', example: 'Apex Procurement Authority' },
        registrationNumber: { type: 'string', example: 'ORG-APEX-2026' },
        type: { type: 'string', enum: ['BUYER', 'VENDOR'], example: 'BUYER' },
        address: { type: 'string', example: '45 Lotus Tower Rd, Colombo' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 409, description: 'Registration number already exists' })
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  async create(
    @Body() body: CreateOrganizationInput,
    @CurrentUser() user: JwtPayload
  ): Promise<OrganizationDto> {
    return this.createOrganizationUseCase.execute(body, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve organization profile by ID' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization profile found' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getById(@Param('id') id: string): Promise<OrganizationDto> {
    return this.getOrganizationUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization profile (members only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Apex Global Procurement' },
        address: { type: 'string', example: 'Updated Headquarters Address' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this organization' })
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationInput,
    @CurrentUser() user: JwtPayload
  ): Promise<OrganizationDto> {
    return this.updateOrganizationUseCase.execute(id, body, user.sub);
  }
}
