import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { TransformEndpointPayload } from './pipes/transform-endpoint-payload.pipe';
import { Endpoint } from './types/endpoint.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/checks')
  getChecks(@Query('exchange') exchange: string) {
    return this.appService.getChecks(exchange);
  }

  @Post('/endpoint')
  @UsePipes(TransformEndpointPayload)
  addEndpoint(@Body() payload: Endpoint) {
    return this.appService.addEndpoint(payload);
  }
}
