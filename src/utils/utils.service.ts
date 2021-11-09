import { Injectable } from '@nestjs/common';
import { URL } from 'node:url';

@Injectable()
export class UtilsService {
  parseQuery(url: string) {
    const { searchParams } = new URL(url);
    return Object.fromEntries(searchParams.entries());
  }
}
