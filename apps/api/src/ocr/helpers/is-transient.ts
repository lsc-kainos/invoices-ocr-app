import { APICallError } from 'ai';

interface MaybeError {
  status?: number;
  code?: string;
  name?: string;
  response?: { status?: number };
}

export function isTransient(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;

  // AI SDK (`ai` package) shape — APICallError exposes isRetryable + statusCode.
  if (APICallError.isInstance(err)) {
    if (err.isRetryable === true) return true;
    if (
      err.statusCode != null &&
      (err.statusCode === 429 || err.statusCode >= 500)
    ) {
      return true;
    }
    return false;
  }

  // Legacy OpenAI SDK / generic network shapes.
  const e = err as MaybeError;
  const status = e.status ?? e.response?.status;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;
  if (
    e.code === 'ETIMEDOUT' ||
    e.code === 'ECONNRESET' ||
    e.code === 'ECONNREFUSED'
  ) {
    return true;
  }
  if (e.name === 'TimeoutError') return true;
  return false;
}
