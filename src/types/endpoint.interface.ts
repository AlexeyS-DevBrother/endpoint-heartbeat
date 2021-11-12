import { HTTP_METHODS } from 'src/enums/http-methods.enum';

export interface Endpoint {
  url: string;
  exchangeRequired: boolean;
  tokenRequired: boolean;
  method: HTTP_METHODS;
  payload?: any;
}
