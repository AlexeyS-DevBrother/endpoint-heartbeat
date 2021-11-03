import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenPayload } from '../types/token-payload.interface';
import { TokenResponse } from '../types/token-response.type';
import { urls } from '../urls';

@Injectable()
export class AuthService {
  async getToken(credsWithExchange: TokenPayload): Promise<string> {
    try {
      const { data } = await axios.post<TokenResponse>(
        urls.getAccessTokenURL,
        credsWithExchange,
      );
      return data.exchange_access_token;
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }
}
