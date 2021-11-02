import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GetTokenDto } from '../dto/get-token.dto';
import { TokenData } from '../types/token-data.type';
import { TokenResponse } from '../types/token-response.type';
import { urls } from '../urls';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}
  #payload: GetTokenDto = {
    exchange: this.configService.get('exchange'),
    username: this.configService.get('username'),
    password: this.configService.get('password'),
  };

  async getToken(): Promise<TokenData> {
    try {
      const { data } = await axios.post<TokenResponse>(
        urls.getAccessTokenURL,
        this.#payload,
      );
      return {
        access: data.exchange_access_token,
        refresh: data.exchange_refresh_token,
        exp: Date.now() + data.expires_in,
      };
    } catch (err) {
      throw new BadRequestException('Payload is not valid!');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const { data } = await axios.post<TokenResponse>(urls.refreshTokenURL, {
      refreshToken,
      exchange: this.#payload.exchange,
    });
    return {
      access: data.exchange_access_token,
      refresh: data.exchange_refresh_token,
      exp: Date.now() + data.expires_in,
    };
  }
}
