import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { UtilsModule } from 'src/utils/utils.module';
import { ChecksService } from './checks.service';

@Module({
  imports: [AuthModule, DbModule, UtilsModule, ConfigModule.forRoot()],
  providers: [ChecksService],
  exports: [ChecksService],
})
export class ChecksModule {}
