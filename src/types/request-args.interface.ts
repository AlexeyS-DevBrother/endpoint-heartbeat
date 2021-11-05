import { HTTP_METHODS } from 'src/enums/http-methods.enum';

export interface RequestArgs {
  url: string;
  exchange: string;
  method: HTTP_METHODS;
  headers?: any;
  payload?: any;
}
