import { APICallError } from 'ai';
import { isTransient } from './is-transient';

describe('isTransient', () => {
  describe('AI SDK APICallError', () => {
    it('isRetryable=true é transiente', () => {
      const err = new APICallError({
        message: 'retryable',
        url: 'https://api.openai.com',
        requestBodyValues: {},
        isRetryable: true,
      });
      expect(isTransient(err)).toBe(true);
    });

    it('statusCode=429 é transiente', () => {
      const err = new APICallError({
        message: 'rate limited',
        url: 'https://api.openai.com',
        requestBodyValues: {},
        statusCode: 429,
        isRetryable: false,
      });
      expect(isTransient(err)).toBe(true);
    });

    it('statusCode=400 é terminal', () => {
      const err = new APICallError({
        message: 'bad request',
        url: 'https://api.openai.com',
        requestBodyValues: {},
        statusCode: 400,
        isRetryable: false,
      });
      expect(isTransient(err)).toBe(false);
    });
  });

  it('legacy { status: 503 } é transiente', () => {
    expect(isTransient({ status: 503 })).toBe(true);
  });

  it('429 é transiente', () => {
    expect(isTransient({ status: 429 })).toBe(true);
  });

  it('5xx é transiente', () => {
    expect(isTransient({ status: 500 })).toBe(true);
    expect(isTransient({ status: 503 })).toBe(true);
  });

  it('timeout é transiente', () => {
    expect(isTransient({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isTransient({ name: 'TimeoutError' })).toBe(true);
  });

  it('ECONNRESET é transiente', () => {
    expect(isTransient({ code: 'ECONNRESET' })).toBe(true);
  });

  it('400 não é transiente', () => {
    expect(isTransient({ status: 400 })).toBe(false);
  });

  it('ZodError não é transiente', () => {
    expect(isTransient({ name: 'ZodError' })).toBe(false);
  });

  it('Error genérico não é transiente', () => {
    expect(isTransient(new Error('boom'))).toBe(false);
  });
});
