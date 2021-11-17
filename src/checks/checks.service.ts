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

  async checkEndpoints(exchange: string, endpoints: Endpoint[]) {
    const headers = await this._getAuthHeader(exchange);
    const promises = endpoints.map(async (endpoint) => {
      const { url, method, exchangeRequired } = endpoint;
      const args: RequestArgs = { url, exchange, method };
      if (url === tradeOrderURL)
        return this._checkTradeOrderOperations(exchange, args);
      if (endpoint.tokenRequired) args.headers = headers;
      if (exchangeRequired)
        args.url = this.utilsService.addQueryParams(url, { exchange });
      if (method === HTTP_METHODS.POST) {
        const item = await this.dbService.getEndpointPayload(exchange, url);
        if (!item) return;
        args.payload = item.payload;
      }
      return this._fetchAndSave(args);
    });
    await Promise.all(promises);
  }

  private async _fetchAndSave(requestArgs: RequestArgs) {
    let timestamp: number, responseTime: number;
    try {
      timestamp = Date.now();
      const response = await this._makeRequest(requestArgs);
      responseTime = Date.now() - timestamp;
      await this._saveResponse(response, requestArgs, timestamp, responseTime);
    } catch (err) {
      responseTime = Date.now() - timestamp;
      await this._processError(err, requestArgs, timestamp, responseTime);
    }
  }

  private async _makeRequest(requestArgs: RequestArgs) {
    const { method, payload, headers, url } = requestArgs;
    const args: [string, any, any?] =
      method === HTTP_METHODS.POST
        ? [url, payload, { headers }]
        : [url, { headers }];
    return axios[method](...args);
  }

  private async _saveResponse(
    res: any,
    requestArgs: RequestArgs,
    timestamp: number,
    responseTime: number,
  ) {
    const { request: _, ...response } = res;
    delete res.response?.request;
    const { url, payload: body, exchange } = requestArgs;
    const entity: IHealthcheckEntity = {
      request: { query: this.utilsService.parseQuery(url), body },
      status: response.isAxiosError
        ? response.response.status
        : response.status,
      response,
      responseTime,
      timestamp,
    };
    try {
      await this.dbService.save(exchange, url, entity);
    } catch (err) {
      console.log('Error saving entity to DB!');
      console.log(url, new Date().toLocaleString(), err, entity);
    }
  }

  private async _processError(
    err: any,
    requestArgs: RequestArgs,
    timestamp: number,
    responseTime: number,
  ) {
    if (err.code === 'EAI_AGAIN' || err.code === 'ECONNRESET') {
      console.log(
        `ERROR: No Internet connection. Time: ${new Date().toLocaleString()}`,
      );
      return;
    }
    if (err.response?.status === 401 || err.status === 404) return;
    const { request: _, ...res } = err;
    const { exchange, url } = requestArgs;
    const status = err.isAxiosError ? res.response.status : res.status;
    const message = res.response.data.message;
    if (status >= 400) await this._notify(exchange, url, status, message);
    console.log(res);
    await this._saveResponse(res, requestArgs, timestamp, responseTime);
  }

  private async _notify(
    exchange: string,
    url: string,
    status: number,
    message: string,
  ) {
    const item = await this.dbService.getHealthCheck(exchange, url);
    if (item.status !== status)
      await this._sendSlackNotification(url, status, message);
  }

  private async _sendSlackNotification(
    endpoint: string,
    status: number,
    message: string,
  ) {
    const url = this.configService.get('slack_webhook_url');
    const webhook = new IncomingWebhook(url);
    try {
      await webhook.send({
        text: `Alert!\n
        Endpoint ${endpoint} returned status ${status}!\n
        Message: ${message}\n
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

  private async _checkTradeOrderOperations(
    exchange: string,
    requestArgs: RequestArgs,
  ) {
    let timestamp: number, responseTime: number;
    try {
      timestamp = Date.now();
      await this.__getTradeAccounts(exchange);
      const payload = await this.__getQuotes(exchange);
      const order_id = await this.__createTradeOrder(payload, exchange);
      const response = await this.__deleteTradeOrder(order_id, exchange);
      responseTime = Date.now() - timestamp;
      await this._saveResponse(response, requestArgs, timestamp, responseTime);
    } catch (err) {
      responseTime = Date.now() - timestamp;
      await this._processError(err, requestArgs, timestamp, responseTime);
    }
  }

  private async __getTradeAccounts(exchange: string) {
    const MINIMAL_BTC_QUANTITY = this.configService.get('MINIMAL_BTC_QUANTITY');
    const PRODUCT = this.configService.get('PRODUCT');
    const headers = await this._getAuthHeader(exchange);
    const { data } = await this._makeRequest({
      exchange,
      method: HTTP_METHODS.GET,
      url: tradeAccountsURL,
      headers,
    });
    const tradeAccounts = data as {
      product: string;
      balance: { active_balance: number };
    }[];
    const btcAcc = tradeAccounts.find(({ product }) => product === PRODUCT);
    if (btcAcc.balance.active_balance < MINIMAL_BTC_QUANTITY)
      throw new BadRequestException('Insufficcient funds!');
  }

  private async __getQuotes(exchange: string) {
    const instrument = this.configService.get('QUOTE_INSTRUMENT');
    const quantity = +this.configService.get('MINIMAL_BTC_QUANTITY');
    const headers = await this._getAuthHeader(exchange);
    const { data } = await this._makeRequest({
      exchange,
      method: HTTP_METHODS.GET,
      url: `${quotesURL}?exchange=${exchange}`,
      headers,
    });
    const quotes = data as {
      pair: string;
      price_24h_max: string;
    }[];
    const quote = quotes.find(({ pair }) => pair === instrument);
    if (!quote) throw new BadRequestException('Quote not found!');
    const max24HPrice = +quote.price_24h_max.split('.')[0];
    const limit_price = max24HPrice * 1.2;
    return {
      instrument,
      limit_price,
      quantity,
      type: 'limit',
      side: 'sell',
      time_in_force: 'gtc',
    };
  }

  private async __createTradeOrder(
    payload: ResolveType<typeof this.__getQuotes>,
    exchange: string,
  ) {
    const headers = await this._getAuthHeader(exchange);
    const { data } = await this._makeRequest({
      exchange,
      method: HTTP_METHODS.POST,
      url: tradeOrderURL,
      headers,
      payload,
    });
    return data.order_id as string;
  }

  private async __deleteTradeOrder(order_id: string, exchange: string) {
    const headers = await this._getAuthHeader(exchange);
    return this._makeRequest({
      exchange,
      method: HTTP_METHODS.DELETE,
      url: tradeOrderURL + '/' + order_id,
      headers,
    });
  }
}
