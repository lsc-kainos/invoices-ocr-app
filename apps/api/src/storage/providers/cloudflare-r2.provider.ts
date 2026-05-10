import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { StorageService } from '../storage.service';

@Injectable()
export class CloudflareR2Provider implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(cfg: ConfigService) {
    this.bucket = cfg.getOrThrow<string>('R2_BUCKET');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: cfg.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async put(path: string, buffer: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: path, Body: buffer }),
    );
  }

  async read(path: string): Promise<Buffer> {
    let body: AsyncIterable<Uint8Array> | undefined;
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      body = res.Body as AsyncIterable<Uint8Array> | undefined;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      const name = (err as { name?: string })?.name;
      if (status === 404 || name === 'NoSuchKey') {
        const enoent = new Error(
          `R2: object not found: ${path}`,
        ) as NodeJS.ErrnoException;
        enoent.code = 'ENOENT';
        throw enoent;
      }
      throw err;
    }

    if (!body) {
      throw new Error(`R2: empty body for ${path}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: path }),
    );
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return true;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      const name = (err as { name?: string })?.name;
      if (status === 404 || name === 'NotFound') return false;
      throw err;
    }
  }
}
