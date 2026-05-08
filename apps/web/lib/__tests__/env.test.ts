import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('env schema', () => {
  it('exige NEXTAUTH_SECRET com pelo menos 32 chars', () => {
    const schema = z.object({ NEXTAUTH_SECRET: z.string().min(32) });
    expect(() => schema.parse({ NEXTAUTH_SECRET: 'short' })).toThrow();
    expect(schema.parse({ NEXTAUTH_SECRET: 'a'.repeat(32) })).toEqual({
      NEXTAUTH_SECRET: 'a'.repeat(32),
    });
  });
});
