import { DynamoDB } from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { TokenPayload } from '../types/token-payload.interface';
import { ICredentials } from '../types/credentials.interface';
import { IHealthcheckEntity } from '../types/healthcheck-entity.interface';
import { Endpoint } from '../types/endpoint.interface';

type ScanInput = DynamoDB.DocumentClient.ScanInput;
type ItemList = DynamoDB.DocumentClient.ItemList;

const ddb = new DynamoDB.DocumentClient({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
});

@Injectable()
export class DbService {
  async getCredsByScanning(): Promise<TokenPayload[]> {
    const params: ScanInput = {
      TableName: 'global_exchanges',
      ProjectionExpression: 'healthcheck, id',
    };
    const items = await this._recursiveScan(params);
    return items.map((item) => {
      const creds = item.healthcheck.exchange;
      const exchange = item.id;
      return { ...creds, exchange };
    });
  }

  getEndpointsByScanning() {
    const params: ScanInput = { TableName: 'endpoints' };
    return this._recursiveScan(params) as Promise<Endpoint[]>;
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

  async saveEndpoint(payload: Endpoint) {
    const { $response } = await ddb
      .put({
        TableName: 'endpoints',
        Item: payload,
      })
      .promise();
    console.log($response);
    return 'NEW ENDPOINT SAVED!';
  }

  async getHealthchecksByExchange(exchange: string) {
    const params: ScanInput = {
      TableName: 'endpoint_healthchecks',
      FilterExpression: '#ex = :exch',
      ProjectionExpression:
        '#ex, endpoint, #st, responseTime, #tsmp, #res, #req',
      ExpressionAttributeNames: {
        '#ex': 'exchange',
        '#st': 'status',
        '#tsmp': 'timestamp',
        '#res': 'response',
        '#req': 'request',
      },
      ExpressionAttributeValues: {
        ':exch': exchange,
      },
    };
    return this._recursiveScan(params);
  }

  private async _recursiveScan(
    params: ScanInput,
    results: ItemList = [],
  ): Promise<ItemList> {
    const { Items, LastEvaluatedKey } = await ddb.scan(params).promise();
    results.push(...Items);
    if (!LastEvaluatedKey) return results;
    params.ExclusiveStartKey = LastEvaluatedKey;
    return this._recursiveScan(params, results);
  }

  async getHealthCheck(exchange: string, endpoint: string) {
    return ddb
      .get({
        TableName: 'endpoint_healthchecks',
        Key: { exchange, endpoint },
        ProjectionExpression: '#st',
        ExpressionAttributeNames: {
          '#st': 'status',
        },
      })
      .promise();
  }
}
