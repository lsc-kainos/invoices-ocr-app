import { ConflictException, NotFoundException } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { PassThrough } from 'node:stream';

describe('DownloadController', () => {
  let ctrl: DownloadController;
  let svc: { buildArchive: jest.Mock };
  let res: { setHeader: jest.Mock; pipe: jest.Mock };

  beforeEach(() => {
    svc = { buildArchive: jest.fn() };
    res = { setHeader: jest.fn(), pipe: jest.fn() };
    ctrl = new DownloadController(svc as unknown as DownloadService);
  });

  it('chama buildArchive com user.id e documentId e faz pipe', async () => {
    const stream = new PassThrough();
    const pipeSpy = jest.spyOn(stream, 'pipe').mockImplementation(() => stream);
    svc.buildArchive.mockResolvedValue({ stream, filename: 'nf.zip' });

    await ctrl.downloadDocument({ id: 'u1' } as any, 'd1', res as any);

    expect(svc.buildArchive).toHaveBeenCalledWith('u1', 'd1');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/zip',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="nf.zip"',
    );
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(pipeSpy).toHaveBeenCalledWith(res);
  });

  it('404 propaga quando doc não pertence ao user', async () => {
    svc.buildArchive.mockRejectedValue(new NotFoundException());
    await expect(
      ctrl.downloadDocument({ id: 'u1' } as any, 'd1', res as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('409 propaga quando status ≠ READY', async () => {
    svc.buildArchive.mockRejectedValue(
      new ConflictException({ code: 'document_not_ready' }),
    );
    await expect(
      ctrl.downloadDocument({ id: 'u1' } as any, 'd1', res as any),
    ).rejects.toMatchObject({
      response: { code: 'document_not_ready' },
    });
  });
});
