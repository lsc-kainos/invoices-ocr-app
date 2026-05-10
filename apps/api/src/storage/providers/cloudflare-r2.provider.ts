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

  private guardPath(path: string): void {
    if (!path) throw new Error('Storage: path vazio');
    if (path.startsWith('/'))
      throw new Error('Storage: absolute path rejeitado');
  }

  async put(path: string, buffer: Buffer): Promise<void> {
    this.guardPath(path);
    // ContentType não é passado intencionalmente: a interface StorageService
    // não expõe MIME e todos os serves passam pelo proxy da API que seta
    // Content-Type a partir do campo mime do banco de dados.
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: path, Body: buffer }),
    );
  }

  async read(path: string): Promise<Buffer> {
    this.guardPath(path);
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
      // SDK usa 'NoSuchKey' para GetObject; status 404 cobre erros HTTP raw
      // antes da deserialização do SDK (ex.: R2 retorna 404 sem body XML).
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
    this.guardPath(path);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: path }),
    );
  }

  async exists(path: string): Promise<boolean> {
    this.guardPath(path);
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: path }),
      );
      return true;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        ?.$metadata?.httpStatusCode;
      const name = (err as { name?: string })?.name;
      // SDK usa 'NotFound' para HeadObject (sem body XML); 'NoSuchKey' não
      // é emitido aqui. status 404 cobre respostas HTTP raw sem deserialização.
      if (status === 404 || name === 'NotFound') return false;
      throw err;
    }
  }
}
