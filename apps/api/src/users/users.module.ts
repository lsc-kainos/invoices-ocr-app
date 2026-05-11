import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { InternalUsersController } from './internal-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [UsersController, InternalUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
