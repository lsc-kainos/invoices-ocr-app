import { UserScopedThrottlerGuard } from './user-scoped-throttler.guard';

describe('UserScopedThrottlerGuard', () => {
  type GuardWithGetTracker = {
    getTracker: (req: unknown) => Promise<string>;
  };

  const makeGuard = (): GuardWithGetTracker =>
    new UserScopedThrottlerGuard(
      {} as never,
      {} as never,
      {} as never,
    ) as unknown as GuardWithGetTracker;

  it('tracker é user:<id> quando req.user existe', async () => {
    const guard = makeGuard();
    const tracker = await guard.getTracker({
      user: { id: 'abc123' },
      ip: '1.2.3.4',
    });
    expect(tracker).toBe('user:abc123');
  });

  it('tracker é ip:<ip> quando não há user', async () => {
    const guard = makeGuard();
    const tracker = await guard.getTracker({ ip: '1.2.3.4' });
    expect(tracker).toBe('ip:1.2.3.4');
  });

  it('tracker é ip:unknown quando nem user nem ip', async () => {
    const guard = makeGuard();
    const tracker = await guard.getTracker({});
    expect(tracker).toBe('ip:unknown');
  });
});
