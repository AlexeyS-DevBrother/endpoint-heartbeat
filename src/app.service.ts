import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';
import { urls } from './urls';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { ThruCacheAsync } from './decorators/thru-cache-async.decorator';
import { DbService } from './db/db.service';
import { UtilsService } from './utils/utils.service';
import { TokenPayload } from './types/token-payload.interface';

@Injectable()
export class AppService implements OnModuleInit {
  private rfqPayload: CreateRfqQuoteDto;

  constructor(
    private authService: AuthService,
    private utilsService: UtilsService,
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

  private async _getAuthHeader(exchange: string) {
    const creds = await this.dbService.getCredsById(exchange);
    const token = await this.getToken({ ...creds, exchange });
    return { Authorization: `Bearer ${token}` };
  }

  private async _makeRequest(url: string, exchange: string, tokenRequired = false) {
    let timestamp: number, responseTime: number, status: number;
    let request, response, headers;
    try {
      if (tokenRequired) headers = await this._getAuthHeader(exchange);
      timestamp = Date.now();
      const { request: req, ...res } = await axios.get(url, { headers });
      responseTime = Date.now() - timestamp;
      (response = res), (request = req), (status = res.status);
    } catch (err) {
      responseTime = Date.now() - timestamp;
      if (!timestamp) throw new BadRequestException('Exchange is invalid!');
      const { request: req, ...res } = err.response;
      if (res.status === 404) throw new BadRequestException('Exchange is invalid!');
      (response = res), (request = req), (status = res.status);
    }
    request = this.utilsService.removeCircular(request);
    const entity = { request, response, responseTime, status, timestamp };
    await this.dbService.save(exchange, url, entity);
  }

  async getInstruments(exchange: string) {
    const url = `${urls.instruments}?exchange=${exchange}`;
    return this._makeRequest(url, exchange, true);
  }

  async getCurrencies(exchange: string) {
    const url = `${urls.currencies}?exchange=${exchange}`;
    return this._makeRequest(url, exchange);
  }

  async getQuotes(exchange: string) {
    const url = `${urls.quotes}?exchange=${exchange}`;
    return this._makeRequest(url, exchange);
  }

  async getSwaggerData(exchange: string) {
    return this._makeRequest(urls.swagger, exchange);
  }

  async getTradeAccounts(exchange: string) {
    const url = urls.trade.accounts;
    return this._makeRequest(url, exchange, true);
  }

  async getTradeTransactions(exchange: string) {
    const url = urls.trade.transactions;
    return this._makeRequest(url, exchange, true);
  }

  async getTradeOpenOrders(exchange: string) {
    const url = urls.trade.orders.open;
    return this._makeRequest(url, exchange, true);
  }

  async getTradeClosedOrders(exchange: string) {
    const url = urls.trade.orders.closed;
    return this._makeRequest(url, exchange, true);
  }

  async createRfqQuote(exchange: string) {
    const payload = this._getRfqPayload();
    try {
      const url = 'https://rfq.cryptosrvc.com/v1/quote';
      const creds = await this.dbService.getCredsById(exchange);
      const token = await this.getToken({ ...creds, exchange });
      const headers = { Authorization: `Bearer ${token}` };
      const { data, status } = await axios.post(url, payload, { headers });
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
    const dry_run = this.utilsService.parseBoolean(raw.dry_run);
    const fees_in_price = this.utilsService.parseBoolean(raw.fees_in_price);
    return { instrument: raw.instrument, quantity, dry_run, fees_in_price };
  }
}
