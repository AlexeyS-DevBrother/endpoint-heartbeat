const checkEndpoints = async (endpoints) => {
  const fetchPromises = endpoints.map((endpoint) =>
    fetch('/api' + endpoint.url + (endpoint.query || '')),
  );
  const responses = await Promise.all(fetchPromises);
  const dataPromises = responses.map((res) => res.json());
  const dataset = await Promise.all(dataPromises);
  const labeledResponses = endpoints.map((endpoint, i) => ({
    endpoint: endpoint.url,
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
  const endpoints = [
    { url: '/instruments', query: '?exchange=DEMO' },
    { url: '/currencies', query: '?exchange=DEMO' },
    { url: '/quotes', query: '?exchange=DEMO' },
    { url: '/trade/accounts' },
    { url: '/trade/transactions' },
    { url: '/trade/orders/open' },
    { url: '/trade/orders/closed' },
    { url: '/swagger' },
    { url: '/rfq-quote' },
  ];
  const labeledResponses = await checkEndpoints(endpoints);
  renderData(labeledResponses);
  console.log(++counter);
};

const bootstrap = async () => {
  checkAndRender();
  const secondsDelay = 15;
  setInterval(checkAndRender, secondsDelay * 1000);
};

window.onload = bootstrap;
