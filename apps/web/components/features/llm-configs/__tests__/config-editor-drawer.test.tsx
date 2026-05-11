import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import type { AvailableModel, LlmConfigDto } from '@invoices-ocr/shared-types';
import messages from '@/messages/pt-BR.json';
import { ConfigEditorDrawer, type EditorMode } from '../config-editor-drawer';

const MODELS: AvailableModel[] = [
  { id: 'gpt-4o', provider: 'openai', requires: 'OPENAI_API_KEY', vision: true },
  { id: 'gpt-4o-mini', provider: 'openai', requires: 'OPENAI_API_KEY', vision: true },
];

const BASE: LlmConfigDto = {
  id: 'cfg-1',
  key: 'EXTRACTOR',
  version: 7,
  model: 'gpt-4o',
  prompt: 'Extraia os campos brasileiros: CNPJ, valor total, chave NF-e.',
  params: { temperature: 0.35 },
  active: true,
  notes: 'iteração inicial',
  createdAt: '2026-05-01T12:34:56.000Z',
  createdBy: 'user-1',
  createdByEmail: 'admin@paggo.test',
};

function renderEditor(mode: EditorMode, onSubmit = vi.fn(async () => undefined)) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <ConfigEditorDrawer mode={mode} onClose={() => {}} models={MODELS} onSubmit={onSubmit} />
    </NextIntlClientProvider>,
  );
}

describe('<ConfigEditorDrawer />', () => {
  it('pre-fills all fields when given a baseConfig in clone mode', () => {
    renderEditor({ kind: 'clone', baseConfig: BASE });

    expect(screen.getByText(/Nova versão a partir de v7/i)).toBeInTheDocument();

    // Prompt textarea pre-filled
    const prompt = screen.getByLabelText(/^Prompt$/i) as HTMLTextAreaElement;
    expect(prompt.value).toBe(BASE.prompt);

    // Temperature pre-filled from params
    const temp = screen.getByLabelText(/^Temperature$/i) as HTMLInputElement;
    expect(temp.value).toBe('0.35');

    // Notes pre-filled
    const notes = screen.getByLabelText(/^Notas/i) as HTMLTextAreaElement;
    expect(notes.value).toBe('iteração inicial');
  });

  it('in readOnly (view) mode, disables inputs and hides submit button', () => {
    renderEditor({ kind: 'view', baseConfig: BASE });

    expect(screen.getByText(/Visualizar v7/i)).toBeInTheDocument();

    const prompt = screen.getByLabelText(/^Prompt$/i) as HTMLTextAreaElement;
    expect(prompt).toBeDisabled();

    const temp = screen.getByLabelText(/^Temperature$/i) as HTMLInputElement;
    expect(temp).toBeDisabled();

    // Submit ("Criar") button must not be in the DOM
    expect(screen.queryByRole('button', { name: /Criar/i })).toBeNull();
  });

  it('disables submit when temperature is empty/NaN', () => {
    renderEditor({ kind: 'clone', baseConfig: BASE });

    const temp = screen.getByLabelText(/^Temperature$/i) as HTMLInputElement;
    const submit = screen.getByRole('button', { name: /Criar/i }) as HTMLButtonElement;

    // Sanity: starts enabled with pre-filled valid temperature + model + prompt
    expect(submit).not.toBeDisabled();

    fireEvent.change(temp, { target: { value: '' } });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/Temperature é obrigatória/i)).toBeInTheDocument();
  });

  it('submits with parsed params.temperature when valid', async () => {
    const onSubmit = vi.fn(async () => undefined);
    renderEditor({ kind: 'clone', baseConfig: BASE }, onSubmit);

    const submit = screen.getByRole('button', { name: /Criar/i });
    fireEvent.click(submit);

    // Wait microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const firstCallArgs = onSubmit.mock.calls[0] as unknown as
      | [{ key: string; model: string; prompt: string; params: { temperature: number } }]
      | undefined;
    expect(firstCallArgs).toBeDefined();
    const call = firstCallArgs![0];
    expect(call.key).toBe('EXTRACTOR');
    expect(call.model).toBe('gpt-4o');
    expect(call.params.temperature).toBeCloseTo(0.35);
    expect(call.prompt).toBe(BASE.prompt);
  });
});
