import { Injectable, OnModuleInit } from '@nestjs/common';
import { endpoints } from './urls';
import { DbService } from './db/db.service';
import { ChecksService } from './checks/checks.service';

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
    const items = await this.dbService.getCredsByScanning();
    const tokenPromises = items.map((item) => {
      this.exchanges.push(item.exchange);
      return this.checksService.getToken(item);
    });
    await Promise.all(tokenPromises);
    const checkEndpointsByExchanges = async () => {
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
}
