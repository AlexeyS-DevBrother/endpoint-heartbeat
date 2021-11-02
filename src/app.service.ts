import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { urls } from './urls';
import { AuthService } from './auth/auth.service';
import { TokenData } from './types/token-data.type';

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

  constructor(private authService: AuthService) {}

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
    const token = await this.getToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getCurrencies(exchange: string) {
    const url = `${urls.currencies}?exchange=${exchange}`;
    const { data } = await axios.get(url);
    return data;
  }

  async getQuotes(exchange: string) {
    const url = `${urls.quotes}?exchange=${exchange}`;
    const { data } = await axios.get(url);
    return data;
  }

  async getTradeAccounts() {
    const url = urls.trade.accounts;
    const token = await this.getToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeTransactions() {
    const url = urls.trade.transactions;
    const token = await this.getToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeOpenOrders() {
    const url = urls.trade.orders.open;
    const token = await this.getToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeClosedOrders() {
    const url = urls.trade.orders.closed;
    const token = await this.getToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getSwaggerData() {
    const url = urls.swagger;
    const { data } = await axios.get(url);
    return data;
  }

  async createRfqQuote(payload: CreateRfqQuoteDto) {
    const url = 'https://rfq.cryptosrvc.com/v1/quote';
    const token = await this.getToken();
    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }
}
