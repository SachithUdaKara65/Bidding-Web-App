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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createOrganizationSchema))
  async create(
    @Body() body: CreateOrganizationInput,
    @CurrentUser() user: JwtPayload
  ): Promise<OrganizationDto> {
    return this.createOrganizationUseCase.execute(body, user.sub);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<OrganizationDto> {
    return this.getOrganizationUseCase.execute(id);
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(updateOrganizationSchema))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationInput,
    @CurrentUser() user: JwtPayload
  ): Promise<OrganizationDto> {
    return this.updateOrganizationUseCase.execute(id, body, user.sub);
  }
}
