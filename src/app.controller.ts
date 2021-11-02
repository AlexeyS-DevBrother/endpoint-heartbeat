import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { GetTokenDto } from './dto/get-token.dto';
import { RfqQuoteInfo } from './pipes/rfq-quote-info.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/item/:id')
  getItem(@Param('id') id: string) {
    return this.appService.getItem(id);
  }

  @Post('/instruments')
  getInstruments(@Body() payload: GetTokenDto) {
    return this.appService.getInstruments(payload);
  }

  @Get('/currencies')
  getCurrencies(@Query('exchange') exchange: string) {
    return this.appService.getCurrencies(exchange);
  }

  @Get('/quotes')
  getQuotes(@Query('exchange') exchange: string) {
    return this.appService.getQuotes(exchange);
  }

  @Post('/trade/accounts')
  getTradeAccounts(@Body() payload: GetTokenDto) {
    return this.appService.getTradeAccounts(payload);
  }

  @Post('/trade/transactions')
  getTradeTransactions(@Body() payload: GetTokenDto) {
    return this.appService.getTradeTransactions(payload);
  }

  @Post('/trade/orders/open')
  getTradeOpenOrders(@Body() payload: GetTokenDto) {
    return this.appService.getTradeOpenOrders(payload);
  }

  @Post('/trade/orders/closed')
  getTradeClosedOrders(@Body() payload: GetTokenDto) {
    return this.appService.getTradeClosedOrders(payload);
  }

  @Get('/swagger')
  getSwaggerData() {
    return this.appService.getSwaggerData();
  }

  @Post('/rfq-quote')
  @UsePipes(RfqQuoteInfo)
  createRfqQuote(@Body() rfqQuoteInfo: CreateRfqQuoteDto) {
    return this.appService.createRfqQuote(rfqQuoteInfo);
  }
}
