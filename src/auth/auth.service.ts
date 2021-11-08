import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { TokenPayload } from '../types/token-payload.interface';
import { TokenResponse } from '../types/token-response.type';
import { getAccessTokenURL } from '../urls';

@Injectable()
export class AuthService {
  async getToken(tokenPayload: TokenPayload): Promise<string> {
    try {
      const { data } = await axios.post<TokenResponse>(
        getAccessTokenURL,
        tokenPayload,
      );
      return data.exchange_access_token;
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }
}
