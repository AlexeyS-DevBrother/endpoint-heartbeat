import { BadRequestException, PipeTransform } from '@nestjs/common';
import { Endpoint } from '../types/endpoint.interface';

export class TransformEndpointPayload implements PipeTransform {
  transform(value: any): Endpoint {
    const endpoint: Endpoint = {
      ...value,
      exchangeRequired: this._parseBoolean(value.exchangeRequired),
      tokenRequired: this._parseBoolean(value.tokenRequired),
    };
    return endpoint;
  }

  _parseBoolean(value: string) {
    if (value === 'true') return true;
    else if (value === 'false') return false;
    else throw new BadRequestException('Value must be convertable to boolean!');
  }
}
