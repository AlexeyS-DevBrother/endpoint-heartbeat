import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { urls } from './urls';
import { AuthService } from './auth/auth.service';
import { TokenData } from './types/token-data.type';
import { ConfigService } from '@nestjs/config';

const ddb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
  apiVersion: '2017-11-29',
});

@Injectable()
export class AppService {
  private accessToken: string;
  private refreshToken: string;
  private expiration: number;
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

  private async getToken() {
    let tokenData: TokenData;
    if (!this.accessToken) {
      tokenData = await this.authService.getToken();
    } else {
      if (Date.now() < this.expiration) return this.accessToken;
      tokenData = await this.authService.refreshAccessToken(this.refreshToken);
    }
    this.cacheTokenData(tokenData);
    return this.accessToken;
  }

  private cacheTokenData(tokenData: TokenData) {
    this.accessToken = tokenData.access;
    this.refreshToken = tokenData.refresh;
    this.expiration = tokenData.exp;
  }

  async getInstruments(exchange: string) {
    const url = `${urls.instruments}?exchange=${exchange}`;
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getCurrencies(exchange: string) {
    const url = `${urls.currencies}?exchange=${exchange}`;
    try {
      const { data, status, statusText } = await axios.get(url);
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getQuotes(exchange: string) {
    const url = `${urls.quotes}?exchange=${exchange}`;
    try {
      const { data, status, statusText } = await axios.get(url);
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeAccounts() {
    const url = urls.trade.accounts;
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeTransactions() {
    const url = urls.trade.transactions;
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeOpenOrders() {
    const url = urls.trade.orders.open;
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeClosedOrders() {
    const url = urls.trade.orders.closed;
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getSwaggerData() {
    const url = urls.swagger;
    try {
      const { data, status, statusText } = await axios.get(url);
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async createRfqQuote() {
    const payload = this.getRfqPayload();
    try {
      const url = 'https://rfq.cryptosrvc.com/v1/quote';
      const token = await this.getToken();
      const { data, status, statusText } = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  private getRfqPayload() {
    if (this.rfqPayload) return this.rfqPayload;
    const raw = {
      instrument: this.configService.get('instrument'),
      quantity: this.configService.get('quantity'),
      fees_in_price: this.configService.get('fees_in_price'),
      dry_run: this.configService.get('dry_run'),
    };
    const payload = this._transformPayload(raw);
    this.rfqPayload = payload;
    return this.rfqPayload;
  }

  private _transformPayload(raw: {
    instrument: string;
    quantity: string;
    fees_in_price: string;
    dry_run: string;
  }): CreateRfqQuoteDto {
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
