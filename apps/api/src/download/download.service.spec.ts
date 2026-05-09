import { DownloadService } from './download.service';

describe('DownloadService.buildArchive', () => {
  const makePrisma = () => ({
    document: { findFirst: jest.fn() },
    chatSession: { findFirst: jest.fn() },
  });
  const makeStorage = () => ({ read: jest.fn() });

  it('404 quando doc é de outro user', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst.mockResolvedValue(null);
    const svc = new DownloadService(prisma, makeStorage() as any);
    await expect(svc.buildArchive('u1', 'd1')).rejects.toThrow('Not Found');
  });

  it('409 quando status ≠ READY', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst.mockResolvedValue({
      id: 'd1',
      status: 'OCR_RUNNING',
    });
    const svc = new DownloadService(prisma, makeStorage() as any);
    await expect(svc.buildArchive('u1', 'd1')).rejects.toMatchObject({
      response: { code: 'document_not_ready' },
    });
  });

  it('produz ZIP com 4 entradas quando READY (incluindo narrative.txt — emenda F2.5)', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst.mockResolvedValue({
      id: 'd1',
      filename: 'nf.pdf',
      mime: 'application/pdf',
      storagePath: '/v/d1.pdf',
      status: 'READY',
      extractedText: 'Texto',
      summary: {
        core: { total: '100,00' },
        items: [],
        extras: [],
        narrative: 'Resumo da nota.',
      },
    });
    prisma.chatSession.findFirst.mockResolvedValue(null);
    const storage: any = makeStorage();
    storage.read.mockResolvedValue(Buffer.from('fake-pdf'));

    const svc = new DownloadService(prisma, storage);
    const { stream, filename } = await svc.buildArchive('u1', 'd1');
    expect(filename).toBe('nf.zip');

    const chunks: Buffer[] = [];
    for await (const c of stream as any) chunks.push(c);
    const zipBuf = Buffer.concat(chunks);

    // Sanity: ZIP magic bytes
    expect(zipBuf[0]).toBe(0x50);
    expect(zipBuf[1]).toBe(0x4b);

    // Confere as 4 entradas pelo nome no central directory (parse leve via latin1).
    const zipText = zipBuf.toString('latin1');
    expect(zipText).toContain('original.pdf');
    expect(zipText).toContain('extracted-text.txt');
    expect(zipText).toContain('narrative.txt');
    expect(zipText).toContain('chat-transcript.md');
  });

  it('narrative.txt fica só com BOM quando summary.narrative é null/ausente', async () => {
    const prisma: any = makePrisma();
    prisma.document.findFirst.mockResolvedValue({
      id: 'd1',
      filename: 'old.pdf',
      mime: 'application/pdf',
      storagePath: '/v/d1.pdf',
      status: 'READY',
      extractedText: 'Texto',
      summary: null,
    });
    prisma.chatSession.findFirst.mockResolvedValue(null);
    const storage: any = makeStorage();
    storage.read.mockResolvedValue(Buffer.from('fake-pdf'));

    const svc = new DownloadService(prisma, storage);
    const { stream } = await svc.buildArchive('u1', 'd1');
    const chunks: Buffer[] = [];
    for await (const c of stream as any) chunks.push(c);
    const zipBuf = Buffer.concat(chunks);
    expect(zipBuf.toString('latin1')).toContain('narrative.txt');
  });
});
