export interface CreateTenderDocumentData {
  tenderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface CreateBidDocumentData {
  bidId: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
}

export interface TenderDocumentWithTender {
  id: string;
  tenderId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  tender: {
    id: string;
    status: string;
    buyerOrgId: string;
  };
}

export interface BidDocumentWithBid {
  id: string;
  bidId: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  uploadedAt: Date;
  bid: {
    id: string;
    tenderId: string;
    bidderOrgId: string;
    bidderUserId: string;
    isSealed: boolean;
    status: string;
    tender: {
      id: string;
      status: string;
      buyerOrgId: string;
    };
  };
}

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
  createTenderDocument(data: CreateTenderDocumentData): Promise<TenderDocumentWithTender>;
  findTenderDocumentById(id: string): Promise<TenderDocumentWithTender | null>;
  createBidDocument(data: CreateBidDocumentData): Promise<BidDocumentWithBid>;
  findBidDocumentById(id: string): Promise<BidDocumentWithBid | null>;
}
