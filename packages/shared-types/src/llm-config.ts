export type LlmConfigKey = 'EXTRACTOR' | 'CHAT';

export type LlmConfigDto = {
  id: string;
  key: LlmConfigKey;
  version: number;
  model: string;
  prompt: string;
  params: Record<string, unknown>;
  active: boolean;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  createdByEmail: string | null;
};

export type CreateLlmConfigInput = {
  key: LlmConfigKey;
  model: string;
  prompt: string;
  params?: Record<string, unknown>;
  notes?: string;
};

export type AvailableModel = {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  requires: string;
  vision: boolean;
};

export type TestLlmConfigInput = { sampleFilename: string };

export type TestLlmConfigResult =
  | { ok: true; result: unknown; durationMs: number }
  | {
      ok: false;
      error: string;
      errorClass: 'refusal' | 'parse-error' | 'unknown';
      durationMs: number;
    };
