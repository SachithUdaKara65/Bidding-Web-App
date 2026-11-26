import { Injectable } from '@nestjs/common';
import {
  IDocumentRepository,
  CreateTenderDocumentData,
  CreateBidDocumentData,
  TenderDocumentWithTender,
  BidDocumentWithBid,
} from '../../../domain/repositories/document.repository.interface';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTenderDocument(data: CreateTenderDocumentData): Promise<TenderDocumentWithTender> {
    const record = await this.prisma.tenderDocument.create({
      data: {
        tenderId: data.tenderId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
      },
      include: {
        tender: {
          select: {
            id: true,
            status: true,
            buyerOrgId: true,
          },
        },
      },
    });

    return {
      id: record.id,
      tenderId: record.tenderId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileType: record.fileType,
      fileSize: record.fileSize,
      uploadedAt: record.uploadedAt,
      tender: record.tender,
    };
  }

  async findTenderDocumentById(id: string): Promise<TenderDocumentWithTender | null> {
    const record = await this.prisma.tenderDocument.findUnique({
      where: { id },
      include: {
        tender: {
          select: {
            id: true,
            status: true,
            buyerOrgId: true,
          },
        },
      },
    });
    if (!record) return null;

    return {
      id: record.id,
      tenderId: record.tenderId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileType: record.fileType,
      fileSize: record.fileSize,
      uploadedAt: record.uploadedAt,
      tender: record.tender,
    };
  }

  async createBidDocument(data: CreateBidDocumentData): Promise<BidDocumentWithBid> {
    const record = await this.prisma.bidDocument.create({
      data: {
        bidId: data.bidId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        documentType: data.documentType,
      },
      include: {
        bid: {
          select: {
            id: true,
            tenderId: true,
            bidderOrgId: true,
            bidderUserId: true,
            isSealed: true,
            status: true,
            tender: {
              select: {
                id: true,
                status: true,
                buyerOrgId: true,
              },
            },
          },
        },
      },
    });

    return {
      id: record.id,
      bidId: record.bidId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      documentType: record.documentType,
      uploadedAt: record.uploadedAt,
      bid: record.bid,
    };
  }

  async findBidDocumentById(id: string): Promise<BidDocumentWithBid | null> {
    const record = await this.prisma.bidDocument.findUnique({
      where: { id },
      include: {
        bid: {
          select: {
            id: true,
            tenderId: true,
            bidderOrgId: true,
            bidderUserId: true,
            isSealed: true,
            status: true,
            tender: {
              select: {
                id: true,
                status: true,
                buyerOrgId: true,
              },
            },
          },
        },
      },
    });
    if (!record) return null;

    return {
      id: record.id,
      bidId: record.bidId,
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      documentType: record.documentType,
      uploadedAt: record.uploadedAt,
      bid: record.bid,
    };
  }
}
