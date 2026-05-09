export type OcrErrorCode =
  | 'rate_limit'
  | 'timeout'
  | 'invalid_image'
  | 'parse_failure'
  | 'provider_error'
  | 'unknown';

interface MaybeError {
  status?: number;
  code?: string;
  name?: string;
  message?: string;
  response?: { status?: number };
}

export function classifyError(err: unknown): OcrErrorCode {
  if (!err || typeof err !== 'object') return 'unknown';
  const e = err as MaybeError;
  const status = e.status ?? e.response?.status;
  const message = (e.message ?? '').toLowerCase();
  const name = e.name ?? '';
  const code = e.code ?? '';

  if (status === 429) return 'rate_limit';
  if (
    code === 'ETIMEDOUT' ||
    name === 'TimeoutError' ||
    message.includes('timeout')
  ) {
    return 'timeout';
  }
  if (message.includes('invalid_image')) return 'invalid_image';
  if (name === 'ZodError' || message.includes('refusal'))
    return 'parse_failure';
  if (typeof status === 'number' && status >= 500) return 'provider_error';
  if (code === 'ECONNRESET' || code === 'ECONNREFUSED') return 'provider_error';
  return 'unknown';
}
