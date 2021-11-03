const ENDPOINTS = [
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

const checkEndpoints = async (endpoints) => {
  const fetchPromises = endpoints.map((endpoint) => fetch('/api' + endpoint));
  const responses = await Promise.all(fetchPromises);
  const dataPromises = responses.map((res) => res.json());
  const dataset = await Promise.all(dataPromises);
  const labeledResponses = endpoints.map((endpoint, i) => ({
    endpoint,
    status: dataset[i].status,
    statusText: dataset[i].statusText,
  }));
  return labeledResponses;
};

const renderData = (labeledResponses) => {
  let tableRows = '';
  for (const response of labeledResponses) {
    const { endpoint, status, statusText } = response;
    const str = `<tr>
      <td class="service-endpoint">${endpoint}</td>
      <td class="service-status">${status}</td>
      <td class="service-status-text">${statusText}</td>
    </tr>`;
    tableRows += str;
  }
  const target = document.querySelector('#data');
  target.innerHTML = '';
  target.insertAdjacentHTML('beforeend', tableRows);
};

let counter = 0;
const checkAndRender = async () => {
  const labeledResponses = await checkEndpoints(ENDPOINTS);
  renderData(labeledResponses);
  console.log(++counter);
};

const bootstrap = async () => {
  checkAndRender();
  const secondsDelay = 15;
  setInterval(checkAndRender, secondsDelay * 1000);
};

window.onload = bootstrap;
