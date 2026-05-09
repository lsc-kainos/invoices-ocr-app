import { classifyError } from './classify-error';

describe('classifyError', () => {
  it('429 → rate_limit', () => {
    expect(classifyError({ status: 429 })).toBe('rate_limit');
    expect(classifyError({ response: { status: 429 } })).toBe('rate_limit');
  });

  it('timeout → timeout', () => {
    expect(classifyError({ code: 'ETIMEDOUT' })).toBe('timeout');
    expect(classifyError({ name: 'TimeoutError' })).toBe('timeout');
  });

  it('5xx → provider_error', () => {
    expect(classifyError({ status: 503 })).toBe('provider_error');
    expect(classifyError({ status: 500 })).toBe('provider_error');
  });

  it('ECONNRESET → provider_error', () => {
    expect(classifyError({ code: 'ECONNRESET' })).toBe('provider_error');
  });

  it('ZodError → parse_failure', () => {
    expect(classifyError({ name: 'ZodError' })).toBe('parse_failure');
  });

  it('mensagem com "invalid_image" → invalid_image', () => {
    expect(classifyError(new Error('invalid_image: pdf encrypted'))).toBe(
      'invalid_image',
    );
  });

  it('mensagem com "refusal" → parse_failure', () => {
    expect(classifyError(new Error('model refusal: cannot process'))).toBe(
      'parse_failure',
    );
  });

  it('default → unknown', () => {
    expect(classifyError(new Error('???'))).toBe('unknown');
    expect(classifyError(null)).toBe('unknown');
  });
});
