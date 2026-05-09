import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { RailwayVolumeProvider } from './railway-volume.provider';

describe('RailwayVolumeProvider', () => {
  let root: string;
  let provider: RailwayVolumeProvider;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vol-'));
    const cfg = {
      getOrThrow: jest.fn().mockReturnValue(root),
    } as unknown as ConfigService;
    provider = new RailwayVolumeProvider(cfg);
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('put + read roundtrip', async () => {
    await provider.put('user1/doc1/original.png', Buffer.from('hello'));
    expect(existsSync(join(root, 'user1', 'doc1', 'original.png'))).toBe(true);
    const buf = await provider.read('user1/doc1/original.png');
    expect(buf.toString()).toBe('hello');
  });

  it('exists retorna true/false correto', async () => {
    expect(await provider.exists('missing/x.png')).toBe(false);
    await provider.put('a/b.png', Buffer.from('x'));
    expect(await provider.exists('a/b.png')).toBe(true);
  });

  it('delete remove o arquivo', async () => {
    await provider.put('a/b.png', Buffer.from('x'));
    await provider.delete('a/b.png');
    expect(await provider.exists('a/b.png')).toBe(false);
  });

  it('rejeita path traversal "../../etc/passwd"', async () => {
    await expect(
      provider.put('../../etc/passwd', Buffer.from('x')),
    ).rejects.toThrow(/traversal/i);
    await expect(provider.read('../../etc/passwd')).rejects.toThrow(
      /traversal/i,
    );
  });

  it('rejeita absolute path', async () => {
    await expect(provider.put('/etc/passwd', Buffer.from('x'))).rejects.toThrow(
      /absolute|traversal/i,
    );
  });

  it('rejeita path vazio', async () => {
    await expect(provider.put('', Buffer.from('x'))).rejects.toThrow();
  });
});
