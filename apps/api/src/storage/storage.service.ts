export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StorageService {
  put(path: string, buffer: Buffer): Promise<void>;
  read(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}
