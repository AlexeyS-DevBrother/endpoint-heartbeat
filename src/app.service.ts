import { BadRequestException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { TokenResponse } from './types/token-response.type';
import { GetTokenDto } from './dto/get-token.dto';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';

const ddb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
  apiVersion: '2017-11-29',
});

@Injectable()
export class AppService {
  private accessToken: string;
  private exchangeDataURL = 'https://exchange-data-service.cryptosrvc.com/v1';
  private tradeServiceURL = 'https://trade-service-sls.cryptosrvc.com';
  private tokenURL =
    'https://authentication.cryptosrvc.com/api/user_authentication/exchangeToken';

  private urls = {
    instruments: this.exchangeDataURL + '/instruments', // ?exchange
    currencies: this.exchangeDataURL + '/currencies', // ?exchange
    quotes: this.exchangeDataURL + '/quotes', // ?exchange
    trade: {
      accounts: this.tradeServiceURL + '/v1/trade/accounts',
      transactions: this.tradeServiceURL + '/v1/trade/transactions',
      orders: {
        open: this.tradeServiceURL + '/v1/trade/orders/open',
        closed: this.tradeServiceURL + '/v1/trade/orders/closed',
      },
    },
    swagger: this.tradeServiceURL + '/swagger/#',
  };

  async getItem(id: string) {
    const { Item } = await ddb
      .getItem({ Key: { id: { S: id } }, TableName: 'global_exchanges' })
      .promise();
    return Item;
  }

  private async getToken(payload: GetTokenDto) {
    try {
      const { data } = await axios.post<TokenResponse>(this.tokenURL, payload);
      this.accessToken = data.exchange_access_token;
      return data.exchange_access_token;
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }

  async getInstruments(payload: GetTokenDto) {
    const url = `${this.urls.instruments}?exchange=${payload.exchange}`;
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken(payload);
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getCurrencies(exchange: string) {
    const url = `${this.urls.currencies}?exchange=${exchange}`;
    const { data } = await axios.get(url);
    return data;
  }

  async getQuotes(exchange: string) {
    const url = `${this.urls.quotes}?exchange=${exchange}`;
    const { data } = await axios.get(url);
    return data;
  }

  async getTradeAccounts(payload: GetTokenDto) {
    const url = this.urls.trade.accounts;
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken(payload);
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeTransactions(payload: GetTokenDto) {
    const url = this.urls.trade.transactions;
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken(payload);
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeOpenOrders(payload: GetTokenDto) {
    const url = this.urls.trade.orders.open;
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken(payload);
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getTradeClosedOrders(payload: GetTokenDto) {
    const url = this.urls.trade.orders.closed;
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken(payload);
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async getSwaggerData() {
    const url = this.urls.swagger;
    const { data } = await axios.get(url);
    return data;
  }

  async createRfqQuote(payload: CreateRfqQuoteDto) {
    const url = 'https://rfq.cryptosrvc.com/v1/quote';
    const token = this.accessToken
      ? this.accessToken
      : await this.getToken({
          exchange: 'DEMO',
          username: 'healthcheck@mailinator.com',
          password: '_qTNu4AZSejLe7cwF',
        });
    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }
}

// /instruments               -- DONE
// /currencies?exchange=DEMO  -- DONE
// /quotes?exchange=DEMO      -- DONE
// /trade/accounts            -- DONE
// /trade/transactions        -- DONE
// /trade/orders/closed       -- DONE
// /trade/orders/open         -- DONE
// /swagger/#                 -- DONE
//
// -- IN PROGRESS --
// POST https://rfq.cryptosrvc.com/v1/quote { instrument: "BTCUSDT", quantity: 0.001, fees_in_price: true, dry_run: true }
//
