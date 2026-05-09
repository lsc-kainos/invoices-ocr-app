import { isTransient } from './is-transient';

describe('isTransient', () => {
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
