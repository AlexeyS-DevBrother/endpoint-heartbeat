import { Body, Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { GetTokenDto } from './dto/get-token.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/item/:id')
  getItem(@Param('id') id: string) {
    return this.appService.getItem(id);
  }

  @Get('/token')
  getToken(@Body() payload: GetTokenDto) {
    return this.appService.getToken(payload);
  }
}
