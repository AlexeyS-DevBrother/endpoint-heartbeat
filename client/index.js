const endpoints = [
  '/instruments',
  '/currencies',
  '/quotes',
  '/trade/accounts',
  '/trade/transactions',
  '/trade/orders/open',
  '/trade/orders/closed',
  '/swagger',
  '/rfq-quote',
];

const getResponse = () => {
  return fetch('/api' + endpoints[0] + '?exchange=DEMO');
};

const bootstrap = async () => {
  const body = document.querySelector('body');
  body.insertAdjacentHTML('afterbegin', '<h1>It worked!</h1>');
  const response = await getResponse();
  const data = await response.json();
  console.log(data);
};

window.onload = bootstrap;
