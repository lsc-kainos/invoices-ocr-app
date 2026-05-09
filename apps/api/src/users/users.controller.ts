import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1')
@SkipThrottle({ benchmark: true })
export class UsersController {
  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    };
  }
}
