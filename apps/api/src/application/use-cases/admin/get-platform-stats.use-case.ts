import { Injectable, Inject } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  IAdminRepository,
} from '../../../domain/repositories/admin.repository.interface';
import { PlatformStatsDto } from '@procurement/shared-types';

@Injectable()
export class GetPlatformStatsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository
  ) {}

  async execute(): Promise<PlatformStatsDto> {
    return this.adminRepository.getStats();
  }
}
