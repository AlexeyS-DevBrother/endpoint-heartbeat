import { BadRequestException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { TokenResponse } from './types/token-response.type';
import { GetTokenDto } from './dto/get-token.dto';

const ddb = new AWS.DynamoDB({
  endpoint: 'http://localhost:8000',
  region: 'localhost',
  apiVersion: '2017-11-29',
});

@Injectable()
export class AppService {
  async getItem(id: string) {
    const { Item } = await ddb
      .getItem({ Key: { id: { S: id } }, TableName: 'global_exchanges' })
      .promise();
    return Item;
  }

  async getToken(payload: GetTokenDto) {
    try {
      const { data } = await axios.post<TokenResponse>(
        'https://authentication.cryptosrvc.com/api/user_authentication/exchangeToken',
        payload,
      );
      return data.exchange_access_token;
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }
}
