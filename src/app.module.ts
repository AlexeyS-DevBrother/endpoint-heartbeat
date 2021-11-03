import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { join } from 'node:path';
import { DbService } from './db/db.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api*'],
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        instrument: Joi.string().required(),
        quantity: Joi.string().required(),
        fees_in_price: Joi.string().required(),
        dry_run: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AuthService, DbService],
})
export class AppModule {}
