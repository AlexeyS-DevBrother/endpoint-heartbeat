import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/item/:id')
  getItem(@Param('id') id: string) {
    return this.appService.getItem(id);
  }

  @Get('/instruments')
  getInstruments() {
    return this.appService.getInstruments();
  }

  @Get('/currencies')
  getCurrencies() {
    return this.appService.getCurrencies();
  }

  @Get('/quotes')
  getQuotes() {
    return this.appService.getQuotes();
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

  @Get('/rfq-quote')
  createRfqQuote() {
    return this.appService.createRfqQuote();
  }
}
