import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InternalOnly } from '../auth/decorators/internal-only.decorator';
import { UsersService } from './users.service';
import { SyncUserDto } from './dto/sync-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@Controller('api/v1/internal/users')
@SkipThrottle({ benchmark: true })
export class InternalUsersController {
  constructor(private readonly users: UsersService) {}

  @InternalOnly()
  @Post('sync')
  async sync(@Body() dto: SyncUserDto) {
    const user = await this.users.upsertByEmail({
      email: dto.email,
      name: dto.name,
      avatar: dto.avatar,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    };
  }

  @InternalOnly()
  @Delete('by-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteByEmail(@Body() dto: DeleteUserDto): Promise<void> {
    await this.users.deleteByEmail(dto.email);
  }
}
