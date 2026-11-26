export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface GenerateSignedUrlParams {
  bucket: string;
  fileKey: string;
  fileType?: string;
  expiresInSeconds?: number;
}

export interface IStorageService {
  generateUploadUrl(params: GenerateSignedUrlParams): Promise<string>;
  generateDownloadUrl(params: GenerateSignedUrlParams): Promise<string>;
}
