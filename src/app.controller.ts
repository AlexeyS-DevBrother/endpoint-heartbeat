import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  getTradeAccounts(@Query('exchange') exchange: string) {
    return this.appService.getTradeAccounts(exchange);
  }

  @Get('/trade/transactions')
  getTradeTransactions(@Query('exchange') exchange: string) {
    return this.appService.getTradeTransactions(exchange);
  }

  @Get('/trade/orders/open')
  getTradeOpenOrders(@Query('exchange') exchange: string) {
    return this.appService.getTradeOpenOrders(exchange);
  }

  @Get('/trade/orders/closed')
  getTradeClosedOrders(@Query('exchange') exchange: string) {
    return this.appService.getTradeClosedOrders(exchange);
  }

  @Get('/swagger')
  getSwaggerData(@Query('exchange') exchange: string) {
    return this.appService.getSwaggerData(exchange);
  }

  @Get('/rfq-quote')
  createRfqQuote(@Query('exchange') exchange: string) {
    return this.appService.createRfqQuote(exchange);
  }
}
