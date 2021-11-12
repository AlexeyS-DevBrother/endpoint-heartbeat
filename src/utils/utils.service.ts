import { Injectable } from '@nestjs/common';
import { URL } from 'node:url';
import { Scalar } from '../types/scalar.type';

@Injectable()
export class UtilsService {
  parseQuery(url: string) {
    const { searchParams } = new URL(url);
    return Object.fromEntries(searchParams.entries());
  }

  addQueryParams(url: string, paramsObj: { [key: string]: Scalar }): string {
    const urlObj = new URL(url);
    Object.keys(paramsObj).forEach((key) =>
      urlObj.searchParams.append(key, paramsObj[key].toString()),
    );
    return urlObj.href;
  }
}
