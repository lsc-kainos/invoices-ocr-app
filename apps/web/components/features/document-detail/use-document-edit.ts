'use client';

import { useState } from 'react';
import type {
  DocumentDetail,
  InvoiceCore,
  InvoiceItem,
  InvoiceSummary,
} from '@invoices-ocr/shared-types';

export function useDocumentEdit(doc: DocumentDetail, onSaved: (updated: DocumentDetail) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<InvoiceSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  function startEdit() {
    const base = doc.summary;
    setDraft(
      base
        ? {
            core: { ...base.core },
            items: base.items.map((i) => ({ ...i })),
            extras: base.extras.map((e) => ({ ...e })),
            narrative: base.narrative,
          }
        : {
            core: {
              invoiceNumber: null,
              invoiceDate: null,
              dueDate: null,
              sellerName: null,
              sellerAddress: null,
              clientName: null,
              clientAddress: null,
              tax: null,
              discount: null,
              total: null,
              paymentMethod: null,
            },
            items: [],
            extras: [],
            narrative: '',
          },
    );
    setIsEditing(true);
    setSaveError(false);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
    setSaveError(false);
  }

  async function saveSummary() {
    if (!draft) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`/api/documents/${doc.id}/summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: draft }),
      });
      if (!res.ok) throw new Error('failed');
      const updated = (await res.json()) as DocumentDetail;
      onSaved(updated);
      setIsEditing(false);
      setDraft(null);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof InvoiceCore, value: string) {
    setDraft((prev) => (prev ? { ...prev, core: { ...prev.core, [field]: value || null } } : prev));
  }

  function updateNarrative(value: string) {
    setDraft((prev) => (prev ? { ...prev, narrative: value } : prev));
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value || null } : item,
      );
      return { ...prev, items };
    });
  }

  function addItem() {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            items: [
              ...prev.items,
              { description: '', quantity: null, unitPrice: null, totalPrice: null },
            ],
          }
        : prev,
    );
  }

  function removeItem(idx: number) {
    setDraft((prev) => (prev ? { ...prev, items: prev.items.filter((_, i) => i !== idx) } : prev));
  }

  return {
    isEditing,
    draft,
    isSaving,
    saveError,
    startEdit,
    cancelEdit,
    saveSummary,
    updateField,
    updateNarrative,
    updateItem,
    addItem,
    removeItem,
  };
}
