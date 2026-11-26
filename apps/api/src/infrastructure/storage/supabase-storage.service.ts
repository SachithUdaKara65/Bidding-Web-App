import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IStorageService, GenerateSignedUrlParams } from '../../application/ports/storage.port';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const apiPort = this.configService.get<string>('API_PORT', '3001');

    this.baseUrl = supabaseUrl
      ? `${supabaseUrl}/storage/v1`
      : `http://localhost:${apiPort}/api/v1/storage-mock`;

    this.secretKey =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'storage-secret-key-fallback-32-chars-long';
  }

  async generateUploadUrl(params: GenerateSignedUrlParams): Promise<string> {
    const expiresIn = params.expiresInSeconds || 900; // 15 mins default
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const signature = this.createSignature(
      'PUT',
      params.bucket,
      params.fileKey,
      expiresAt
    );

    return `${this.baseUrl}/object/upload/sign/${params.bucket}/${encodeURIComponent(
      params.fileKey
    )}?token=${signature}&expires=${expiresAt}`;
  }

  async generateDownloadUrl(params: GenerateSignedUrlParams): Promise<string> {
    const expiresIn = params.expiresInSeconds || 3600; // 1 hour default
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const signature = this.createSignature(
      'GET',
      params.bucket,
      params.fileKey,
      expiresAt
    );

    return `${this.baseUrl}/object/sign/${params.bucket}/${encodeURIComponent(
      params.fileKey
    )}?token=${signature}&expires=${expiresAt}`;
  }

  private createSignature(
    method: string,
    bucket: string,
    fileKey: string,
    expiresAt: number
  ): string {
    const payload = `${method}:${bucket}:${fileKey}:${expiresAt}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }
}
