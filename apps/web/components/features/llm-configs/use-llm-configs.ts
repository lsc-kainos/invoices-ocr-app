'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  LlmConfigDto,
  LlmConfigKey,
  CreateLlmConfigInput,
  AvailableModel,
  TestLlmConfigResult,
} from '@invoices-ocr/shared-types';

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

export type LlmConfigsByKey = Record<LlmConfigKey, LlmConfigDto[]>;
export type ActiveLlmConfigsByKey = Record<LlmConfigKey, LlmConfigDto | undefined>;

const EMPTY_BY_KEY: LlmConfigsByKey = { EXTRACTOR: [], CHAT: [] };

export function useLlmConfigs() {
  const [configs, setConfigs] = useState<LlmConfigDto[]>([]);
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) setIsLoading(true);
      try {
        const [cfgs, mdls] = await Promise.all([
          fetchJson<LlmConfigDto[]>('/api/admin/llm-configs'),
          fetchJson<AvailableModel[]>('/api/admin/llm-configs/available-models'),
        ]);
        if (!cancelled) {
          setConfigs(cfgs);
          setModels(mdls);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const byKey = useMemo<LlmConfigsByKey>(() => {
    const out: LlmConfigsByKey = { EXTRACTOR: [], CHAT: [] };
    for (const c of configs) {
      out[c.key].push(c);
    }
    // Newest first (highest version → top)
    for (const k of Object.keys(out) as LlmConfigKey[]) {
      out[k] = out[k].slice().sort((a, b) => b.version - a.version);
    }
    return out;
  }, [configs]);

  const active = useMemo<ActiveLlmConfigsByKey>(
    () => ({
      EXTRACTOR: byKey.EXTRACTOR.find((c) => c.active),
      CHAT: byKey.CHAT.find((c) => c.active),
    }),
    [byKey],
  );

  async function create(input: CreateLlmConfigInput): Promise<LlmConfigDto> {
    const r = await fetch('/api/admin/llm-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error(await r.text());
    const created = (await r.json()) as LlmConfigDto;
    reload();
    return created;
  }

  async function activate(id: string): Promise<LlmConfigDto | null> {
    const r = await fetch(`/api/admin/llm-configs/${id}/activate`, { method: 'POST' });
    if (!r.ok) throw new Error(await r.text());
    // Try to parse activated dto from response body (best-effort: route may return empty)
    let dto: LlmConfigDto | null = null;
    try {
      dto = (await r.json()) as LlmConfigDto;
    } catch {
      dto = configs.find((c) => c.id === id) ?? null;
    }
    reload();
    return dto;
  }

  async function test(id: string, sampleFilename: string): Promise<TestLlmConfigResult> {
    const r = await fetch(`/api/admin/llm-configs/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleFilename }),
    });
    return r.json() as Promise<TestLlmConfigResult>;
  }

  return {
    configs,
    byKey: byKey ?? EMPTY_BY_KEY,
    active,
    models,
    isLoading,
    create,
    activate,
    test,
  };
}
