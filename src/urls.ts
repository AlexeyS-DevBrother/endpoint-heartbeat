const exchangeDataURL = 'https://exchange-data-service.cryptosrvc.com/v1';
const tradeServiceURL = 'https://trade-service-sls.cryptosrvc.com';
const tokenURL =
  'https://authentication.cryptosrvc.com/api/user_authentication';

const urls = {
  instruments: exchangeDataURL + '/instruments',
  currencies: exchangeDataURL + '/currencies',
  quotes: exchangeDataURL + '/quotes',
  swagger: tradeServiceURL + '/swagger/#',
  trade: {
    accounts: tradeServiceURL + '/v1/trade/accounts',
    transactions: tradeServiceURL + '/v1/trade/transactions',
    order: tradeServiceURL + '/v1/trade/order',
    orders: {
      open: tradeServiceURL + '/v1/trade/orders/open',
      closed: tradeServiceURL + '/v1/trade/orders/closed',
    },
  },
  rfqQuote: 'https://rfq.cryptosrvc.com/v1/quote',
  getAccessTokenURL: tokenURL + '/exchangeToken',
  refreshTokenURL: tokenURL + '/refreshAccessToken',
  getUserMfaSettings: tokenURL + '/getUserMfaSettings',
};

export const getAccessTokenURL = urls.getAccessTokenURL;
export const getUserMfaSettings = urls.getUserMfaSettings;
export const tradeAccountsURL = urls.trade.accounts;
export const quotesURL = urls.quotes;
export const tradeOrderURL = urls.trade.order;
