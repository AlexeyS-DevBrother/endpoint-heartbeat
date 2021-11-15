import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { DbService } from '../db/db.service';
import { Payload } from '../types/payload.entity';
import { TokenPayload } from '../types/token-payload.interface';
import { TokenResponse } from '../types/token-response.type';
import { getAccessTokenURL, getUserMfaSettings } from '../urls';

@Injectable()
export class AuthService {
  constructor(private dbService: DbService) {}

  async getToken(tokenPayload: TokenPayload): Promise<string> {
    const { exchange } = tokenPayload;
    try {
      const { data } = await axios.post<TokenResponse>(
        getAccessTokenURL,
        tokenPayload,
      );
      const { exchange_access_token: clientToken } = data;
      const payload: Payload = {
        endpoint: getUserMfaSettings,
        exchange,
        payload: { clientToken, exchange },
      };
      await this.dbService.savePayload(payload);
      return clientToken;
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }
}
