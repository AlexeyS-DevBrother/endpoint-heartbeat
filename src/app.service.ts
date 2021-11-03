import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { urls } from './urls';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { ThruCacheAsync } from './decorators/thru-cache-async.decorator';
import { DbService } from './db/db.service';
import { TokenPayload } from './types/token-payload.interface';

@Injectable()
export class AppService implements OnModuleInit {
  private rfqPayload: CreateRfqQuoteDto;

  constructor(
    private authService: AuthService,
    private dbService: DbService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const items = await this.dbService.getCredsByScanning();
    const promises = items.map(this.getToken.bind(this));
    await Promise.all(promises);
  }

  @ThruCacheAsync(1800 * 1000)
  private getToken(tokenPayload: TokenPayload) {
    return this.authService.getToken(tokenPayload);
  }

  private async _makeRequestWithoutToken(url: string) {
    try {
      const { data, status } = await axios.get(url);
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const status = err.response?.status || err.statusCode;
      const statusText = err.response?.statusText || err.code;
      return { status, statusText };
    }
  }

  private async _makeRequestWithToken(url: string, exchange: string) {
    try {
      const creds = await this.dbService.getCredsById(exchange);
      const token = await this.getToken({
        username: creds.username,
        password: creds.password,
        exchange,
      });
      const { data, status } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const status = err.response?.status || err.statusCode;
      const statusText = err.response?.statusText || err.code;
      return { status, statusText };
    }
  }

  async getInstruments(exchange: string) {
    const url = `${urls.instruments}?exchange=${exchange}`;
    return this._makeRequestWithToken(url, exchange);
  }

  async getCurrencies(exchange: string) {
    const url = `${urls.currencies}?exchange=${exchange}`;
    return this._makeRequestWithoutToken(url);
  }

  async getQuotes(exchange: string) {
    const url = `${urls.quotes}?exchange=${exchange}`;
    return this._makeRequestWithoutToken(url);
  }

  async getSwaggerData() {
    return this._makeRequestWithoutToken(urls.swagger);
  }

  async getTradeAccounts(exchange: string) {
    const url = urls.trade.accounts;
    return this._makeRequestWithToken(url, exchange);
  }

  async getTradeTransactions(exchange: string) {
    const url = urls.trade.transactions;
    return this._makeRequestWithToken(url, exchange);
  }

  async getTradeOpenOrders(exchange: string) {
    const url = urls.trade.orders.open;
    return this._makeRequestWithToken(url, exchange);
  }

  async getTradeClosedOrders(exchange: string) {
    const url = urls.trade.orders.closed;
    return this._makeRequestWithToken(url, exchange);
  }

  async createRfqQuote(exchange: string) {
    const payload = this._getRfqPayload();
    try {
      const url = 'https://rfq.cryptosrvc.com/v1/quote';
      const creds = await this.dbService.getCredsById(exchange);
      const token = await this.getToken({
        username: creds.username,
        password: creds.password,
        exchange,
      });
      const { data, status } = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data && status < 400) return { status, statusText: 'Service is up!' };
    } catch (err) {
      const status = err.response?.status || err.statusCode;
      const statusText = err.response?.statusText || err.code;
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
