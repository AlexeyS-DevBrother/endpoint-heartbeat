import { DynamoDB } from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { TokenPayload } from '../types/token-payload.interface';
import { ICredentials } from '../types/credentials.interface';
import { IHealthcheckEntity } from '../types/healthcheck-entity.interface';

const ddb = new DynamoDB.DocumentClient({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
});

@Injectable()
export class DbService {
  async getCredsByScanning(): Promise<TokenPayload[]> {
    const { Items } = await ddb
      .scan({
        TableName: 'global_exchanges',
        ProjectionExpression: 'healthcheck, id',
      })
      .promise();
    return Items.map((item) => {
      const creds = item.healthcheck.exchange;
      const exchange = item.id;
      return { ...creds, exchange };
    });
  }

  async getCredsById(id: string): Promise<ICredentials> {
    const { Item } = await ddb
      .get({
        TableName: 'global_exchanges',
        Key: { id },
        ProjectionExpression: 'healthcheck',
      })
      .promise();
    return Item.healthcheck.exchange;
  }

  async save(exchange: string, endpoint: string, entity: IHealthcheckEntity) {
    await ddb
      .put({
        TableName: 'endpoint_healthchecks',
        Item: { exchange, endpoint, ...entity },
      })
      .promise();
  }
}
