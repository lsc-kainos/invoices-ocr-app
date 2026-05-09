import { GetFullDocumentTool } from './get-full-document.tool';

describe('GetFullDocumentTool.execute', () => {
  const findFirst = jest.fn();
  const tool = new GetFullDocumentTool({
    document: { findFirst },
  } as any);

  beforeEach(() => findFirst.mockReset());

  it('retorna extractedText quando doc é do user e está READY', async () => {
    findFirst.mockResolvedValue({ extractedText: 'Texto', status: 'READY' });
    const r = await tool.execute({ documentId: 'd1' }, { userId: 'u1' });
    expect(r).toEqual({ extractedText: 'Texto' });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'd1', userId: 'u1' },
      select: { extractedText: true, status: true },
    });
  });

  it('retorna { error: "not_found" } quando doc não existe ou é de outro user', async () => {
    findFirst.mockResolvedValue(null);
    const r = await tool.execute({ documentId: 'd1' }, { userId: 'u1' });
    expect(r).toEqual({ error: 'not_found' });
  });

  it('retorna { error: "not_ready" } quando status ≠ READY', async () => {
    findFirst.mockResolvedValue({ extractedText: '', status: 'OCR_RUNNING' });
    const r = await tool.execute({ documentId: 'd1' }, { userId: 'u1' });
    expect(r).toEqual({ error: 'not_ready' });
  });

  it('retorna { error: "invalid_arguments" } com args malformados', async () => {
    const r = await tool.execute({ wrong: 'shape' }, { userId: 'u1' });
    expect(r).toEqual({ error: 'invalid_arguments' });
  });

  it('retorna { error: "no_text" } quando doc está READY mas extractedText é nulo', async () => {
    findFirst.mockResolvedValue({ extractedText: null, status: 'READY' });
    const r = await tool.execute({ documentId: 'd1' }, { userId: 'u1' });
    expect(r).toEqual({ error: 'no_text' });
  });
});
