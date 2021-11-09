export interface IHealthcheckEntity {
  response: any;
  request: { query: { [s: string]: string }; body?: { [s: string]: any } };
  status: number;
  responseTime: number;
  timestamp: number;
}
