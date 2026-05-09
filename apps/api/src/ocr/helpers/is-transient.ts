interface MaybeError {
  status?: number;
  code?: string;
  name?: string;
  response?: { status?: number };
}

export function isTransient(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
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
