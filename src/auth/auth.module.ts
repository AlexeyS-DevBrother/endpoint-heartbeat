import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AuthService } from './auth.service';

@Module({
  imports: [DbModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
