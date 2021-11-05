import { HTTP_METHODS } from 'src/enums/http-methods.enum';

export interface Endpoint {
  getUrl: (exchange: string) => string;
  tokenRequired: boolean;
  method: HTTP_METHODS;
  payload?: any;
}
