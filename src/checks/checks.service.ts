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

@Injectable()
export class ChecksService {
  constructor(
    private authService: AuthService,
    private dbService: DbService,
    private utilsService: UtilsService,
  ) {}

  @ThruCacheAsync(1800 * 1000)
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
    let request, response;
    const { exchange, method, payload, headers, url } = requestArgs;
    try {
      timestamp = Date.now();
      const args: [string, any, any?] =
        method === HTTP_METHODS.POST
          ? [url, payload, { headers }]
          : [url, { headers }];
      const { request: req, ...res } = await axios[method](...args);
      responseTime = Date.now() - timestamp;
      (response = res), (request = req), (status = res.status);
    } catch (err) {
      responseTime = Date.now() - timestamp;
      if (!timestamp) throw new BadRequestException('Exchange is invalid!');
      const { request: req, ...res } = err.response;
      if (res.status === 404)
        throw new BadRequestException('Exchange is invalid!');
      (response = res), (request = req), (status = res.status);
    }
    request = this.utilsService.removeCircular(request);
    const entity = { request, response, responseTime, status, timestamp };
    await this.dbService.save(exchange, url, entity);
  }

  async checkEndpoints(exchange: string, endpoints: Endpoint[]) {
    const headers = await this._getAuthHeader(exchange);
    const promises = endpoints.map((endpoint) => {
      const { getUrl, method } = endpoint;
      const url = getUrl(exchange);
      const args: RequestArgs = { url, exchange, method };
      if (endpoint.tokenRequired) args.headers = headers;
      if (method === HTTP_METHODS.POST) args.payload = endpoint.payload;
      return this._makeRequest(args);
    });
    await Promise.all(promises);
  }
}
