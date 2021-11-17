import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from './db/db.service';
import { ChecksService } from './checks/checks.service';
import { Endpoint } from './types/endpoint.interface';
import { Payload } from './types/payload.entity';

@Injectable()
export class AppService implements OnModuleInit {
  private exchanges: string[];

  constructor(
    private dbService: DbService,
    private checksService: ChecksService,
  ) {
    this.exchanges = [];
  }

  async onModuleInit() {
    const exchangeCreds = await this.dbService.getCredsByScanning();
    const tokenPromises = exchangeCreds.map((item) => {
      this.exchanges.push(item.exchange);
      return this.checksService.getToken(item);
    });
    await Promise.all(tokenPromises);
    const checkEndpointsByExchanges = async () => {
      const endpoints = await this.dbService.getEndpointsByScanning();
      const promises = this.exchanges.map((exchange) =>
        this.checksService.checkEndpoints(exchange, endpoints),
      );
      await Promise.all(promises);
    };
    await checkEndpointsByExchanges();
    setInterval(checkEndpointsByExchanges, 15 * 1000);
  }

  getChecks(exchange: string) {
    return this.dbService.getHealthchecksByExchange(exchange);
  }

  addEndpoint(payload: Endpoint) {
    return this.dbService.saveEndpoint(payload);
  }

  addPayload(payload: Payload) {
    return this.dbService.savePayload(payload);
  }
}
