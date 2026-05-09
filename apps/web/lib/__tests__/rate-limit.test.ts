import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, __resetForTests } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    __resetForTests();
    vi.useRealTimers();
  });

  it('5 chamadas ok, 6ª 429', () => {
    for (let i = 0; i < 5; i++) expect(rateLimit('1.2.3.4').limited).toBe(false);
    expect(rateLimit('1.2.3.4').limited).toBe(true);
  });

  it('reseta janela após 60s', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    for (let i = 0; i < 5; i++) rateLimit('1.2.3.4');
    vi.setSystemTime(60_001);
    expect(rateLimit('1.2.3.4').limited).toBe(false);
  });

  it('IPs separados não interferem', () => {
    for (let i = 0; i < 5; i++) rateLimit('1.1.1.1');
    expect(rateLimit('2.2.2.2').limited).toBe(false);
  });
});
