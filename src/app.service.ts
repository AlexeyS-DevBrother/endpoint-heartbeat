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
    try {
      const token = await this.getToken();
      const { data, status, statusText } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText };
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getCurrencies(exchange: string) {
    const url = `${urls.currencies}?exchange=${exchange}`;
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getQuotes(exchange: string) {
    const url = `${urls.quotes}?exchange=${exchange}`;
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeAccounts() {
    const url = urls.trade.accounts;
    try {
      const token = await this.getToken();
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeTransactions() {
    const url = urls.trade.transactions;
    try {
      const token = await this.getToken();
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeOpenOrders() {
    const url = urls.trade.orders.open;
    try {
      const token = await this.getToken();
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getTradeClosedOrders() {
    const url = urls.trade.orders.closed;
    try {
      const token = await this.getToken();
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async getSwaggerData() {
    const url = urls.swagger;
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }

  async createRfqQuote(payload: CreateRfqQuoteDto) {
    try {
      const url = 'https://rfq.cryptosrvc.com/v1/quote';
      const token = await this.getToken();
      const { data } = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      const { status, statusText } = err.response;
      return { status, statusText };
    }
  }
}
