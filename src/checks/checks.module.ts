import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { UtilsModule } from 'src/utils/utils.module';
import { ChecksService } from './checks.service';

@Module({
  imports: [AuthModule, DbModule, UtilsModule],
  providers: [ChecksService],
  exports: [ChecksService],
})
export class ChecksModule {}
