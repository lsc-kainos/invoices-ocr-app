import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface ReqWithUser {
  user?: { id?: string };
  ip?: string;
}

@Injectable()
export class UserScopedThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: ReqWithUser): Promise<string> {
    const userId = req?.user?.id;
    if (userId) return `user:${userId}`;
    return `ip:${req?.ip ?? 'unknown'}`;
  }
}
