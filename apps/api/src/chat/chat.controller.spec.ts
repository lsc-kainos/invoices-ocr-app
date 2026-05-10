import { Test } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let ctrl: ChatController;
  let svc: {
    createSession: jest.Mock;
    listSessions: jest.Mock;
    listMessages: jest.Mock;
    sendWorkspaceMessage: jest.Mock;
    listDocumentMessages: jest.Mock;
    sendDocumentMessage: jest.Mock;
    clearDocumentMessages: jest.Mock;
    streamingEnabled: boolean;
  };

  beforeEach(async () => {
    svc = {
      createSession: jest.fn(),
      listSessions: jest.fn(),
      listMessages: jest.fn(),
      sendWorkspaceMessage: jest.fn(),
      listDocumentMessages: jest.fn(),
      sendDocumentMessage: jest.fn(),
      clearDocumentMessages: jest.fn(),
      streamingEnabled: false,
    };
    const mod = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: svc }],
    }).compile();
    ctrl = mod.get(ChatController);
  });

  it('POST sessions chama createSession com user.id', async () => {
    svc.createSession.mockResolvedValue({ id: 's1', createdAt: new Date() });
    const r = await ctrl.createSession({ id: 'u1' });
    expect(svc.createSession).toHaveBeenCalledWith('u1');
    expect(r).toHaveProperty('id', 's1');
  });

  it('GET sessions chama listSessions com user.id e limit padrão', async () => {
    svc.listSessions.mockResolvedValue([]);
    const q = { limit: 50 };
    const r = await ctrl.listSessions({ id: 'u1' }, q);
    expect(svc.listSessions).toHaveBeenCalledWith('u1', 50);
    expect(r).toEqual([]);
  });

  it('GET sessions/:id/messages chama listMessages com includeTool=false quando não informado', async () => {
    svc.listMessages.mockResolvedValue([]);
    const r = await ctrl.listMessages({ id: 'u1' }, 's1', undefined);
    expect(svc.listMessages).toHaveBeenCalledWith('u1', 's1', false);
    expect(r).toEqual([]);
  });

  it('POST sessions/:id/messages chama sendWorkspaceMessage com user.id, sessionId, content', async () => {
    svc.sendWorkspaceMessage.mockResolvedValue({ content: 'ok' });
    const req = { headers: { accept: 'application/json' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as any;
    const r = await ctrl.sendWorkspaceMessage(
      { id: 'u1' },
      's1',
      { content: 'oi' },
      req,
      res,
    );
    expect(svc.sendWorkspaceMessage).toHaveBeenCalledWith('u1', 's1', 'oi');
    expect(r).toEqual({ content: 'ok' });
  });

  it('GET documents/:documentId/messages chama listDocumentMessages com includeTool=false', async () => {
    svc.listDocumentMessages.mockResolvedValue([]);
    const r = await ctrl.listDocumentMessages({ id: 'u1' }, 'doc1', undefined);
    expect(svc.listDocumentMessages).toHaveBeenCalledWith('u1', 'doc1', false);
    expect(r).toEqual([]);
  });

  it('POST documents/:documentId/messages chama sendDocumentMessage', async () => {
    svc.sendDocumentMessage.mockResolvedValue({ content: 'ok' });
    const req = { headers: { accept: 'application/json' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as any;
    const r = await ctrl.sendDocumentMessage(
      { id: 'u1' },
      'd1',
      { content: 'pergunta' },
      req,
      res,
    );
    expect(svc.sendDocumentMessage).toHaveBeenCalledWith(
      'u1',
      'd1',
      'pergunta',
    );
    expect(r).toEqual({ content: 'ok' });
  });

  it('DELETE documents/:documentId/messages chama clearDocumentMessages', async () => {
    svc.clearDocumentMessages.mockResolvedValue(undefined);
    await ctrl.clearDocumentMessages({ id: 'u1' }, 'doc1');
    expect(svc.clearDocumentMessages).toHaveBeenCalledWith('u1', 'doc1');
  });
});
