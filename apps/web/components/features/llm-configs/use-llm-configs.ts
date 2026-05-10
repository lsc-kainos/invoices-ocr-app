'use client';
import { useCallback, useEffect, useState } from 'react';
import type {
  LlmConfigDto,
  CreateLlmConfigInput,
  AvailableModel,
  TestLlmConfigResult,
} from '@invoices-ocr/shared-types';

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

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

  async function activate(id: string) {
    const r = await fetch(`/api/admin/llm-configs/${id}/activate`, { method: 'POST' });
    if (!r.ok) throw new Error(await r.text());
    reload();
  }

  async function test(id: string, sampleFilename: string): Promise<TestLlmConfigResult> {
    const r = await fetch(`/api/admin/llm-configs/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleFilename }),
    });
    return r.json() as Promise<TestLlmConfigResult>;
  }

  async function reloadCache() {
    await fetch('/api/admin/llm-configs/reload-cache', { method: 'POST' });
    reload();
  }

  return {
    configs,
    models,
    isLoading,
    create,
    activate,
    test,
    reloadCache,
  };
}
