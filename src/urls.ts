const exchangeDataURL = 'https://exchange-data-service.cryptosrvc.com/v1';
const tradeServiceURL = 'https://trade-service-sls.cryptosrvc.com';
const tokenURL =
  'https://authentication.cryptosrvc.com/api/user_authentication';

export const urls = {
  exchangeDataURL,
  tradeServiceURL,
  getAccessTokenURL: tokenURL + '/exchangeToken',
  refreshTokenURL: tokenURL + '/refreshAccessToken',
  instruments: exchangeDataURL + '/instruments',
  currencies: exchangeDataURL + '/currencies',
  quotes: exchangeDataURL + '/quotes',
  trade: {
    accounts: tradeServiceURL + '/v1/trade/accounts',
    transactions: tradeServiceURL + '/v1/trade/transactions',
    orders: {
      open: tradeServiceURL + '/v1/trade/orders/open',
      closed: tradeServiceURL + '/v1/trade/orders/closed',
    },
  },
  swagger: tradeServiceURL + '/swagger/#',
};
