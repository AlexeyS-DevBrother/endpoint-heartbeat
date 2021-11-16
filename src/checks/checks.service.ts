import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { DbService } from 'src/db/db.service';
import { ThruCacheAsync } from 'src/decorators/thru-cache-async.decorator';
import { TokenPayload } from 'src/types/token-payload.interface';
import { UtilsService } from 'src/utils/utils.service';
import axios from 'axios';
import { Endpoint } from 'src/types/endpoint.interface';
import { HTTP_METHODS } from 'src/enums/http-methods.enum';
import { RequestArgs } from 'src/types/request-args.interface';
import { IncomingWebhook } from '@slack/webhook';
import { ConfigService } from '@nestjs/config';
import { IHealthcheckEntity } from '../types/healthcheck-entity.interface';
import { quotesURL, tradeAccountsURL, tradeOrderURL } from '../urls';
import { ResolveType } from '../types/resolve.type';
import { response } from 'express';

@Injectable()
export class ChecksService {
  constructor(
    private authService: AuthService,
    private dbService: DbService,
    private utilsService: UtilsService,
    private configService: ConfigService,
  ) {}

  @ThruCacheAsync(15 * 60 * 1000)
  getToken(tokenPayload: TokenPayload) {
    return this.authService.getToken(tokenPayload);
  }

  private async _getAuthHeader(exchange: string) {
    const creds = await this.dbService.getCredsById(exchange);
    const token = await this.getToken({ ...creds, exchange });
    return { Authorization: `Bearer ${token}` };
  }

  private async _makeRequest(requestArgs: RequestArgs) {
    let timestamp: number, responseTime: number, status: number;
    let response;
    const { exchange, method, payload, headers, url } = requestArgs;
    try {
      const args: [string, any, any?] =
        method === HTTP_METHODS.POST
          ? [url, payload, { headers }]
          : [url, { headers }];
      timestamp = Date.now();
      const { request: _, ...res } = await axios[method](...args);
      responseTime = Date.now() - timestamp;
      (response = res), (status = res.status);
    } catch (err) {
      responseTime = Date.now() - timestamp;
      if (err.code === 'EAI_AGAIN' || err.code === 'ECONNRESET') {
        console.log(
          `ERROR: No Internet connection.\nResource: ${url}\nTime: ${new Date().toLocaleString()}\n\n`,
        );
        return;
      }
      if (err.response?.status === 401) return;
      if (!timestamp || err.status === 404)
        throw new BadRequestException('Exchange is invalid!');
      const { request: _, ...res } = err;
      const { request: __, ...resWithoutReq } = res.response;
      res.response = resWithoutReq;
      (response = res), (status = res.status);
    }
    if (status >= 400) {
      const item = await this.dbService.getHealthCheck(exchange, url);
      if (item.status !== status) await this.sendSlackNotification(url, status);
    }
    const request = { query: this.utilsService.parseQuery(url), body: payload };
    const entity: IHealthcheckEntity = {
      request,
      response,
      responseTime,
      status,
      timestamp,
    };
    try {
      await this.dbService.save(exchange, url, entity);
    } catch (err) {
      console.log('Error saving entity to DB!');
      console.log(url, new Date().toLocaleString(), err, entity);
    }
  }

  async checkEndpoints(exchange: string, endpoints: Endpoint[]) {
    const headers = await this._getAuthHeader(exchange);
    const promises = endpoints.map(async (endpoint) => {
      const { url, method, exchangeRequired } = endpoint;
      const args: RequestArgs = { url, exchange, method };
      if (endpoint.tokenRequired) args.headers = headers;
      if (exchangeRequired)
        args.url = this.utilsService.addQueryParams(url, { exchange });
      if (method === HTTP_METHODS.POST) {
        const item = await this.dbService.getEndpointPayload(exchange, url);
        if (!item) return;
        args.payload = item.payload;
      }
      return this._makeRequest(args);
    });
    await Promise.all(promises);
  }

  async makeComplexCheck(exchange: string) {
    const headers = await this._getAuthHeader(exchange);
    const instrument = 'BTCUSD';
    const MINIMAL_BTC_QUANTITY = 0.0001;

    const start = Date.now();
    const tradeAccResponse = await axios.get(tradeAccountsURL, { headers });
    const tradeAccounts = tradeAccResponse.data as {
      product: string;
      balance: { active_balance: number };
    }[];
    const btcAcc = tradeAccounts.find(({ product }) => product === 'BTC');
    if (btcAcc.balance.active_balance < MINIMAL_BTC_QUANTITY)
      throw new BadRequestException('Insufficcient funds!');
    const quotesResponse = await axios.get(
      `${quotesURL}?exchange=${exchange}`,
      { headers },
    );
    const quotes = quotesResponse.data as {
      pair: string;
      price_24h_max: string;
    }[];
    const quote = quotes.find(({ pair }) => pair === instrument);
    const max24HPrice = +quote.price_24h_max.split('.')[0];
    const limit_price = max24HPrice + 0.2 * max24HPrice;
    const payload = {
      instrument,
      quantity: MINIMAL_BTC_QUANTITY,
      type: 'limit',
      side: 'sell',
      limit_price,
      time_in_force: 'gtc',
    };
    const tradeOrderResponse = await axios.post(tradeOrderURL, payload, {
      headers,
    });
    const { order_id } = tradeOrderResponse.data as { order_id: string };
    const response = await axios.delete(`${tradeOrderURL}/${order_id}`, {
      headers,
    });
    const end = Date.now() - start;

    console.log('order deleted', response.status, response.statusText, end);
  }

  async sendSlackNotification(endpoint: string, status: number) {
    const url = this.configService.get('slack_webhook_url');
    const webhook = new IncomingWebhook(url);
    try {
      await webhook.send({
        text: `Alert!\n
        Endpoint ${endpoint} returned status ${status}!\n
        Date: ${new Date().toUTCString()}`,
      });
    } catch (err) {
      console.log(
        `Error thrown by webhook!
        Date:${new Date().toUTCString()}
        ${err}\n\n`,
      );
    }
  }
}
