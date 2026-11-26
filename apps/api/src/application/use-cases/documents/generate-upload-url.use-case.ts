import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../../domain/repositories/document.repository.interface';
import {
  TENDER_REPOSITORY,
  ITenderRepository,
} from '../../../domain/repositories/tender.repository.interface';
import {
  BID_REPOSITORY,
  IBidRepository,
} from '../../../domain/repositories/bid.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import {
  STORAGE_SERVICE,
  IStorageService,
} from '../../ports/storage.port';
import {
  GenerateUploadUrlInput,
} from '@procurement/shared-validation';
import {
  UploadUrlResponseDto,
  UserRole,
  JwtPayload,
  StorageBucket,
} from '@procurement/shared-types';

@Injectable()
export class GenerateUploadUrlUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(TENDER_REPOSITORY)
    private readonly tenderRepository: ITenderRepository,
    @Inject(BID_REPOSITORY)
    private readonly bidRepository: IBidRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService
  ) {}

  async execute(
    dto: GenerateUploadUrlInput,
    currentUser: JwtPayload
  ): Promise<UploadUrlResponseDto> {
    const timestamp = Date.now();
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (dto.bucket === StorageBucket.TENDER_DOCUMENTS) {
      if (!dto.tenderId) {
        throw new BadRequestException('tenderId is required for tender-documents');
      }

      const tender = await this.tenderRepository.findById(dto.tenderId);
      if (!tender) {
        throw new NotFoundException('Tender not found');
      }

      if (currentUser.role !== UserRole.ADMIN) {
        const isBuyerMember = await this.organizationRepository.isMember(
          currentUser.sub,
          tender.buyerOrgId
        );
        if (!isBuyerMember) {
          throw new ForbiddenException(
            'Only the buyer organization can upload tender documents'
          );
        }
      }

      const fileKey = `tenders/${dto.tenderId}/${timestamp}-${sanitizedFileName}`;

      const doc = await this.documentRepository.createTenderDocument({
        tenderId: dto.tenderId,
        fileName: dto.fileName,
        fileUrl: fileKey,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
      });

      const uploadUrl = await this.storageService.generateUploadUrl({
        bucket: dto.bucket,
        fileKey,
        fileType: dto.fileType,
        expiresInSeconds: 900,
      });

      return {
        uploadUrl,
        fileKey,
        documentId: doc.id,
        bucket: dto.bucket,
        expiresIn: 900,
      };
    } else {
      if (!dto.bidId) {
        throw new BadRequestException('bidId is required for bid-submissions');
      }

      const bidDetails = await this.bidRepository.findWithDetails(dto.bidId);
      if (!bidDetails) {
        throw new NotFoundException('Bid not found');
      }

      const { bid, tender } = bidDetails;

      if (currentUser.role !== UserRole.ADMIN) {
        const isBidderMember = await this.organizationRepository.isMember(
          currentUser.sub,
          bid.bidderOrgId
        );
        if (bid.bidderUserId !== currentUser.sub && !isBidderMember) {
          throw new ForbiddenException(
            'Only the submitting vendor organization can upload bid documents'
          );
        }
      }

      if (tender && new Date() > tender.submissionDeadline) {
        throw new BadRequestException(
          'Cannot upload bid documents after tender submission deadline'
        );
      }

      const fileKey = `bids/${dto.bidId}/${timestamp}-${sanitizedFileName}`;

      const doc = await this.documentRepository.createBidDocument({
        bidId: dto.bidId,
        fileName: dto.fileName,
        fileUrl: fileKey,
        documentType: dto.documentType || 'PROPOSAL_ATTACHMENT',
      });

      const uploadUrl = await this.storageService.generateUploadUrl({
        bucket: dto.bucket,
        fileKey,
        fileType: dto.fileType,
        expiresInSeconds: 900,
      });

      return {
        uploadUrl,
        fileKey,
        documentId: doc.id,
        bucket: dto.bucket,
        expiresIn: 900,
      };
    }
  }
}
