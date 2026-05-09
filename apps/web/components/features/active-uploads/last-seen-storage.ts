const KEY = 'invoices-ocr:active-uploads:lastSeen';

export function readLastSeen(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function writeLastSeen(value: string = new Date().toISOString()): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, value);
}
