import { HTTP_METHODS } from './enums/http-methods.enum';
import { Endpoint } from './types/endpoint.interface';

const exchangeDataURL = 'https://exchange-data-service.cryptosrvc.com/v1';
const tradeServiceURL = 'https://trade-service-sls.cryptosrvc.com';
const tokenURL =
  'https://authentication.cryptosrvc.com/api/user_authentication';

export const urls = {
  instruments: exchangeDataURL + '/instruments',
  currencies: exchangeDataURL + '/currencies',
  quotes: exchangeDataURL + '/quotes',
  swagger: tradeServiceURL + '/swagger/#',
  trade: {
    accounts: tradeServiceURL + '/v1/trade/accounts',
    transactions: tradeServiceURL + '/v1/trade/transactions',
    orders: {
      open: tradeServiceURL + '/v1/trade/orders/open',
      closed: tradeServiceURL + '/v1/trade/orders/closed',
    },
  },
  rfqQuote: 'https://rfq.cryptosrvc.com/v1/quote',
  getAccessTokenURL: tokenURL + '/exchangeToken',
  refreshTokenURL: tokenURL + '/refreshAccessToken',
};

export const endpoints: Endpoint[] = [
  {
    getUrl: (s) => urls.instruments + `?exchange=${s}`,
    tokenRequired: true,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: (s) => urls.currencies + `?exchange=${s}`,
    tokenRequired: false,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: (s) => urls.quotes + `?exchange=${s}`,
    tokenRequired: false,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.swagger,
    tokenRequired: false,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.trade.accounts,
    tokenRequired: true,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.trade.transactions,
    tokenRequired: true,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.trade.orders.open,
    tokenRequired: true,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.trade.orders.closed,
    tokenRequired: true,
    method: HTTP_METHODS.GET,
  },
  {
    getUrl: () => urls.rfqQuote,
    tokenRequired: true,
    method: HTTP_METHODS.POST,
    payload: {
      instrument: 'BTCUSDT',
      quantity: 0.001,
      fees_in_price: true,
      dry_run: true,
    },
  },
  {
    getUrl: () => urls.getAccessTokenURL,
    tokenRequired: false,
    method: HTTP_METHODS.POST,
    payload: {
      username: '',
      password: '',
      exchange: '',
    },
  },
];
