import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { CloudflareR2Provider } from './cloudflare-r2.provider';

function makeProvider(): CloudflareR2Provider {
  const cfg = {
    getOrThrow: (key: string) => {
      const vals: Record<string, string> = {
        R2_BUCKET: 'test-bucket',
        R2_ACCOUNT_ID: 'acc123',
        R2_ACCESS_KEY_ID: 'key-id',
        R2_SECRET_ACCESS_KEY: 'secret',
      };
      return (
        vals[key] ??
        (() => {
          throw new Error(`Missing ${key}`);
        })()
      );
    },
  } as unknown as ConfigService;
  return new CloudflareR2Provider(cfg);
}

function makeAsyncIterable(chunks: Uint8Array[]): AsyncIterable<Uint8Array> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) yield chunk;
    },
  };
}

describe('CloudflareR2Provider', () => {
  let provider: CloudflareR2Provider;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    provider = makeProvider();
    sendSpy = jest.spyOn(S3Client.prototype, 'send');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('put', () => {
    it('sends PutObjectCommand with correct Bucket, Key, and Body', async () => {
      sendSpy.mockResolvedValueOnce({});
      const buf = Buffer.from('hello');
      await provider.put('user/doc/file.jpg', buf);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      const cmd = sendSpy.mock.calls[0][0] as {
        input: Record<string, unknown>;
      };
      expect(cmd.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'user/doc/file.jpg',
        Body: buf,
      });
    });
  });

  describe('read', () => {
    it('concatenates streamed chunks into a Buffer', async () => {
      const chunks = [
        new Uint8Array([104, 101]),
        new Uint8Array([108, 108, 111]),
      ];
      sendSpy.mockResolvedValueOnce({ Body: makeAsyncIterable(chunks) });
      const result = await provider.read('some/path');
      expect(result).toEqual(Buffer.from('hello'));
    });

    it('normalizes 404 S3 error to ENOENT', async () => {
      const s3Err = Object.assign(new Error('NoSuchKey'), {
        name: 'NoSuchKey',
        $metadata: { httpStatusCode: 404 },
      });
      sendSpy.mockRejectedValueOnce(s3Err);
      await expect(provider.read('missing/key')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    });

    it('rethrows non-404 errors unchanged', async () => {
      const networkErr = Object.assign(new Error('Network'), {
        $metadata: { httpStatusCode: 500 },
      });
      sendSpy.mockRejectedValueOnce(networkErr);
      await expect(provider.read('some/path')).rejects.toBe(networkErr);
    });

    it('throws if Body is absent', async () => {
      sendSpy.mockResolvedValueOnce({ Body: undefined });
      await expect(provider.read('some/path')).rejects.toThrow('empty body');
    });
  });

  describe('delete', () => {
    it('sends DeleteObjectCommand with correct Key', async () => {
      sendSpy.mockResolvedValueOnce({});
      await provider.delete('user/doc/file.jpg');
      const cmd = sendSpy.mock.calls[0][0] as {
        input: Record<string, unknown>;
      };
      expect(cmd.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'user/doc/file.jpg',
      });
    });
  });

  describe('exists', () => {
    it('returns true when HeadObjectCommand succeeds', async () => {
      sendSpy.mockResolvedValueOnce({});
      await expect(provider.exists('some/path')).resolves.toBe(true);
    });

    it('returns false on 404', async () => {
      const notFound = Object.assign(new Error('NotFound'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      });
      sendSpy.mockRejectedValueOnce(notFound);
      await expect(provider.exists('missing')).resolves.toBe(false);
    });

    it('rethrows non-404 errors', async () => {
      const err = Object.assign(new Error('Forbidden'), {
        $metadata: { httpStatusCode: 403 },
      });
      sendSpy.mockRejectedValueOnce(err);
      await expect(provider.exists('some/path')).rejects.toBe(err);
    });
  });
});
