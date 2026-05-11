'use client';

import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import type { DocumentEditDto, DocumentEditSnapshot } from '@invoices-ocr/shared-types';
import { useEditHistory } from './use-edit-history';

interface EditHistoryTabProps {
  documentId: string;
  verifiedAt: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function initials(name: string | null, email: string | null): string {
  const src = (name ?? email ?? '?').trim();
  if (!src) return '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

interface FieldDiff {
  path: string;
  before: unknown;
  after: unknown;
}

function flatten(obj: DocumentEditSnapshot, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as DocumentEditSnapshot, path));
    } else {
      out[path] = v;
    }
  }
  return out;
}

/**
 * Diff superficial entre snapshots. Achata um nível pra detectar campos
 * aninhados em `core.*`. Arrays (items/extras) entram como JSON pra evitar
 * uma UI de diff de lista que sairia do escopo desta tela. Schemas mais
 * inteligentes (linhas adicionadas/removidas) ficam pra depois.
 */
function diffSnapshots(before: DocumentEditSnapshot, after: DocumentEditSnapshot): FieldDiff[] {
  const flatBefore = flatten(before);
  const flatAfter = flatten(after);
  const keys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);
  const out: FieldDiff[] = [];
  for (const key of keys) {
    const b = flatBefore[key];
    const a = flatAfter[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      out.push({ path: key, before: b, after: a });
    }
  }
  return out.sort((x, y) => x.path.localeCompare(y.path));
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function EditCard({ edit }: { edit: DocumentEditDto }) {
  const t = useTranslations('document.editHistory');
  const diffs = diffSnapshots(edit.before ?? {}, edit.after ?? {});
  const displayName = edit.editor.name ?? edit.editor.email ?? '—';

  return (
    <li className="border-border/40 bg-muted/20 rounded-lg border p-3 text-[12px]">
      <div className="flex items-start gap-2.5">
        <div
          aria-hidden
          className="bg-muted text-muted-foreground ring-border/40 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-medium tracking-wide ring-1"
        >
          {initials(edit.editor.name, edit.editor.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Pencil size={11} aria-hidden className="text-muted-foreground" />
            <span className="text-foreground font-medium">{displayName}</span>
          </div>
          {edit.editor.email && edit.editor.name ? (
            <div className="text-muted-foreground mt-0.5 text-[11px]">{edit.editor.email}</div>
          ) : null}
          <div className="text-muted-foreground mt-0.5 text-[11px]">
            {formatDate(edit.createdAt)}
          </div>
        </div>
      </div>

      {diffs.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-[11px] italic">{t('noFieldsChanged')}</p>
      ) : (
        <ul className="border-border/40 mt-2.5 flex flex-col gap-2 border-l border-dashed pl-3">
          {diffs.map((d) => (
            <li key={d.path} className="flex flex-col gap-0.5">
              <div className="text-foreground font-mono text-[11px]">{d.path}</div>
              <div className="text-muted-foreground text-[11px]">
                <span className="text-muted-foreground/70">— {t('before')}: </span>
                <span className="text-foreground/70 decoration-destructive/40 line-through">
                  {renderValue(d.before)}
                </span>
              </div>
              <div className="text-muted-foreground text-[11px]">
                <span className="text-muted-foreground/70">— {t('after')}: </span>
                <span className="text-foreground">{renderValue(d.after)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function EditHistoryTab({ documentId, verifiedAt }: EditHistoryTabProps) {
  const t = useTranslations('document.editHistory');
  const { edits, isLoading, error } = useEditHistory(documentId, verifiedAt);

  if (isLoading) {
    return <p className="text-muted-foreground text-[12px] italic">{t('loading')}</p>;
  }
  if (error) {
    return <p className="text-destructive text-[12px]">{t('error')}</p>;
  }
  if (edits.length === 0) {
    return <p className="text-muted-foreground text-[12px] italic">{t('empty')}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {edits.map((edit) => (
        <EditCard key={edit.id} edit={edit} />
      ))}
    </ul>
  );
}
