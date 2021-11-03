import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { urls } from './urls';
import { AuthService } from './auth/auth.service';
import { TokenData } from './types/token-data.type';
import { ConfigService } from '@nestjs/config';
import { ThruCacheAsync } from './decorators/thru-cache-async.decorator';

const ddb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
  apiVersion: '2017-11-29',
});

@Injectable()
export class AppService {
  private rfqPayload: CreateRfqQuoteDto;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async getItem(id: string) {
    const { Item } = await ddb
      .getItem({ Key: { id: { S: id } }, TableName: 'global_exchanges' })
      .promise();
    return Item;
  }

  @ThruCacheAsync(1800 * 1000)
  private async getToken() {
    return this.authService.getToken();
  }

  private async _makeRequestWithoutToken(url: string) {
    try {
      const { data, status } = await axios.get(url);
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  private async _makeRequestWithToken(url: string) {
    try {
      const token = await this.getToken();
      const { data, status } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getInstruments() {
    const exchange = this.configService.get('exchange');
    const url = `${urls.instruments}?exchange=${exchange}`;
    return this._makeRequestWithToken(url);
  }

  async getCurrencies() {
    const exchange = this.configService.get('exchange');
    const url = `${urls.currencies}?exchange=${exchange}`;
    return this._makeRequestWithoutToken(url);
  }

  async getQuotes() {
    const exchange = this.configService.get('exchange');
    const url = `${urls.quotes}?exchange=${exchange}`;
    return this._makeRequestWithoutToken(url);
  }

  async getSwaggerData() {
    return this._makeRequestWithoutToken(urls.swagger);
  }

  async getTradeAccounts() {
    const url = urls.trade.accounts;
    return this._makeRequestWithToken(url);
  }

  async getTradeTransactions() {
    const url = urls.trade.transactions;
    return this._makeRequestWithToken(url);
  }

  async getTradeOpenOrders() {
    const url = urls.trade.orders.open;
    return this._makeRequestWithToken(url);
  }

  async getTradeClosedOrders() {
    const url = urls.trade.orders.closed;
    return this._makeRequestWithToken(url);
  }

  async createRfqQuote() {
    const payload = this._getRfqPayload();
    try {
      const url = 'https://rfq.cryptosrvc.com/v1/quote';
      const token = await this.getToken();
      const { data, status } = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  private _getRfqPayload() {
    if (this.rfqPayload) return this.rfqPayload;
    const keys = ['instrument', 'quantity', 'fees_in_price', 'dry_run'];
    const raw: { [key: string]: string } = {};
    keys.forEach((key) => (raw[key] = this.configService.get(key)));
    this.rfqPayload = this._transformPayload(raw);
    return this.rfqPayload;
  }

  private _transformPayload(raw: { [key: string]: string }): CreateRfqQuoteDto {
    const quantity = +raw.quantity;
    const dry_run = this._parseBoolean(raw.dry_run);
    const fees_in_price = this._parseBoolean(raw.fees_in_price);
    return { instrument: raw.instrument, quantity, dry_run, fees_in_price };
  }

  private _parseBoolean(prop: string): boolean {
    if (prop === 'true') return true;
    else if (prop === 'false') return false;
    else prop;
  }
}
