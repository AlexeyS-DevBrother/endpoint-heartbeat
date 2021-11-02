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
import { RfqQuoteInfo } from './pipes/rfq-quote-info.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/item/:id')
  getItem(@Param('id') id: string) {
    return this.appService.getItem(id);
  }

  @Get('/instruments')
  getInstruments(@Query('exchange') exchange: string) {
    return this.appService.getInstruments(exchange);
  }

  @Get('/currencies')
  getCurrencies(@Query('exchange') exchange: string) {
    return this.appService.getCurrencies(exchange);
  }

  @Get('/quotes')
  getQuotes(@Query('exchange') exchange: string) {
    return this.appService.getQuotes(exchange);
  }

  @Get('/trade/accounts')
  getTradeAccounts() {
    return this.appService.getTradeAccounts();
  }

  @Get('/trade/transactions')
  getTradeTransactions() {
    return this.appService.getTradeTransactions();
  }

  @Get('/trade/orders/open')
  getTradeOpenOrders() {
    return this.appService.getTradeOpenOrders();
  }

  @Get('/trade/orders/closed')
  getTradeClosedOrders() {
    return this.appService.getTradeClosedOrders();
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
