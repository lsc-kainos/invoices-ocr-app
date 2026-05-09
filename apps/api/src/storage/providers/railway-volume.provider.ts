import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import type { StorageService } from '../storage.service';

@Injectable()
export class RailwayVolumeProvider implements StorageService {
  private readonly root: string;

  constructor(cfg: ConfigService) {
    this.root = resolve(cfg.getOrThrow<string>('VOLUME_ROOT'));
  }

  private resolveSafe(relPath: string): string {
    if (!relPath) {
      throw new Error('Storage: path vazio');
    }
    if (isAbsolute(relPath)) {
      throw new Error('Storage: absolute path rejeitado (traversal)');
    }
    const full = resolve(this.root, relPath);
    if (!full.startsWith(this.root + sep) && full !== this.root) {
      throw new Error('Storage: path traversal detectado');
    }
    return full;
  }

  async put(path: string, buffer: Buffer): Promise<void> {
    const full = this.resolveSafe(path);
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
  }

  async read(path: string): Promise<Buffer> {
    const full = this.resolveSafe(path);
    return fs.readFile(full);
  }

  async delete(path: string): Promise<void> {
    const full = this.resolveSafe(path);
    await fs.rm(full, { force: true });
  }

  async exists(path: string): Promise<boolean> {
    try {
      const full = this.resolveSafe(path);
      await fs.access(full);
      return true;
    } catch {
      return false;
    }
  }
}
