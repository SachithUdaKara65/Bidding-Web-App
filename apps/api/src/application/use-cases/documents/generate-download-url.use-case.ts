import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../../domain/repositories/document.repository.interface';
import {
  ORGANIZATION_REPOSITORY,
  IOrganizationRepository,
} from '../../../domain/repositories/organization.repository.interface';
import {
  STORAGE_SERVICE,
  IStorageService,
} from '../../ports/storage.port';
import {
  DownloadUrlResponseDto,
  UserRole,
  JwtPayload,
  TenderStatus,
  StorageBucket,
} from '@procurement/shared-types';

@Injectable()
export class GenerateDownloadUrlUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService
  ) {}

  async execute(
    documentId: string,
    currentUser: JwtPayload
  ): Promise<DownloadUrlResponseDto> {
    // 1. Check if document is a TenderDocument
    const tenderDoc = await this.documentRepository.findTenderDocumentById(documentId);
    if (tenderDoc) {
      // If tender is still in DRAFT status, only buyer members or admin can access
      if (tenderDoc.tender.status === TenderStatus.DRAFT && currentUser.role !== UserRole.ADMIN) {
        const isBuyerMember = await this.organizationRepository.isMember(
          currentUser.sub,
          tenderDoc.tender.buyerOrgId
        );
        if (!isBuyerMember) {
          throw new ForbiddenException(
            'Cannot download documents of a private draft tender'
          );
        }
      }

      const downloadUrl = await this.storageService.generateDownloadUrl({
        bucket: StorageBucket.TENDER_DOCUMENTS,
        fileKey: tenderDoc.fileUrl,
        expiresInSeconds: 3600,
      });

      return {
        downloadUrl,
        fileName: tenderDoc.fileName,
        fileType: tenderDoc.fileType,
        documentId: tenderDoc.id,
        expiresIn: 3600,
      };
    }

    // 2. Check if document is a BidDocument
    const bidDoc = await this.documentRepository.findBidDocumentById(documentId);
    if (bidDoc) {
      const { bid } = bidDoc;

      // 2a. ADMIN can always download
      if (currentUser.role === UserRole.ADMIN) {
        return this.createBidDownloadResponse(bidDoc);
      }

      // 2b. Submitting vendor organization members can always download their own docs
      const isBidderMember = await this.organizationRepository.isMember(
        currentUser.sub,
        bid.bidderOrgId
      );
      if (bid.bidderUserId === currentUser.sub || isBidderMember) {
        return this.createBidDownloadResponse(bidDoc);
      }

      // 2c. Buyer organization members can download ONLY AFTER bids are unsealed
      if (bid.tender) {
        const isBuyerMember = await this.organizationRepository.isMember(
          currentUser.sub,
          bid.tender.buyerOrgId
        );

        if (isBuyerMember) {
          const openedStatuses: string[] = [
            TenderStatus.UNDER_EVALUATION,
            TenderStatus.AWARDED,
            TenderStatus.COMPLETED,
          ];

          if (bid.isSealed || !openedStatuses.includes(bid.tender.status)) {
            throw new ForbiddenException(
              'Cannot download sealed bid attachments before official tender bid opening'
            );
          }

          return this.createBidDownloadResponse(bidDoc);
        }
      }

      // 2d. Competitors or unauthorized users are forbidden
      throw new ForbiddenException(
        'Access denied. Competitors cannot access bid documents.'
      );
    }

    throw new NotFoundException('Document not found');
  }

  private async createBidDownloadResponse(
    bidDoc: any
  ): Promise<DownloadUrlResponseDto> {
    const downloadUrl = await this.storageService.generateDownloadUrl({
      bucket: StorageBucket.BID_SUBMISSIONS,
      fileKey: bidDoc.fileUrl,
      expiresInSeconds: 3600,
    });

    return {
      downloadUrl,
      fileName: bidDoc.fileName,
      fileType: bidDoc.documentType,
      documentId: bidDoc.id,
      expiresIn: 3600,
    };
  }
}
