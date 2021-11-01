import { Injectable, OnModuleInit } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const ddb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
  apiVersion: '2017-11-29',
});

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    const params = {
      TableName: 'global_exchanges',
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };
    await ddb.createTable(params).promise();
    const filePath = path.join(process.cwd(), '..', 'sample.json');
    const data = await fs.readFile(filePath, { encoding: 'utf-8' });
    const item = JSON.parse(data);
    await ddb.putItem({ TableName: 'global_exchanges', Item: item }).promise();
  }

  async getItem(id: string) {
    const { Item } = await ddb
      .getItem({ Key: { id: { S: id } }, TableName: 'global_exchanges' })
      .promise();
    return Item;
  }
}
