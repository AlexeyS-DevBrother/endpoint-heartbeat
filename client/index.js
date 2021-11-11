let isActive = false;
const DELAY = 15000;
let checks;

const getChecks = async () => {
  const select = document.querySelector('select');
  const { value: exchange } = select;
  const response = await fetch(`/api/checks?exchange=${exchange}`);
  return response.json();
};

const renderChecksData = async () => {
  checks = await getChecks();
  const dataContainer = document.querySelector('.data-container');
  const head = `<thead>
      <tr>
        <th>Endpoint</th>
        <th>Status</th>
        <th>Response Time</th>
        <th>Date</th>
        <th>Time</th>
        <th>Response</th>
        <th>Request</th>
      </tr>
    </thead>`;
  dataContainer.innerHTML = `<table class="responsive-table striped">
      ${head}
      <tbody></tbody>
    </table>`;
  let tableRows = '';
  for (const check of checks) {
    const { endpoint, responseTime, status, timestamp } = check;
    const rawDate = new Date(timestamp);
    const date = rawDate.toLocaleDateString();
    const time = rawDate.toLocaleTimeString();
    const str = `<tr>
        <td>${endpoint}</td>
        <td>${status}</td>
        <td>${responseTime}</td>
        <td>${date}</td>
        <td>${time}</td>
        <td>
          <a class="check-object-link waves-effect waves-light btn light-green accent-4 black-text" 
            data-endpoint="${endpoint}" 
            data-type="response">
              See object
          </a>
        </td>
        <td>
          <a class="check-object-link waves-effect waves-light btn light-green accent-4 black-text" 
            data-endpoint="${endpoint}" 
            data-type="request">
              See object
          </a>
        </td>
      </tr>`;
    tableRows += str;
  }
  const tbody = dataContainer.querySelector('table.responsive-table > tbody');
  tbody.insertAdjacentHTML('beforeend', tableRows);
  document
    .querySelectorAll('.check-object-link')
    .forEach((obj) => obj.addEventListener('click', displayCheckObj));
};

const displayCheckObj = ({ target }) => {
  const { endpoint, type } = target.dataset;
  const check = checks.find((check) => check.endpoint === endpoint);
  const obj = check[type];
  if (obj.config?.headers) delete obj.config.headers['Authorization']; // for the sake of security
  const json = JSON.stringify(obj, undefined, 2);
  const checkObjContainer = document.querySelector('#check-object-container');
  checkObjContainer.innerHTML = '';
  const headStr = `<div class="row valign-wrapper">
      <h5 class="col s10">${type.toUpperCase()} for ${endpoint}</h5>
      <div class="col s1 offset-s1 right-align">
        <i class="material-icons close-object-info">clear</i>
      </div>
    </div>`;
  const codeStr = `<pre><code>${json}</code></pre>`;
  checkObjContainer.insertAdjacentHTML('beforeend', headStr + codeStr);
  checkObjContainer.querySelectorAll('.close-object-info').forEach((el) => {
    el.addEventListener('click', hideCheckObj);
  });
};

const hideCheckObj = () => {
  document.querySelector('#check-object-container').innerHTML = '';
};

window.onload = () => {
  const startButton = document.querySelector('#start');
  const stopButton = document.querySelector('#stop');
  const clearButton = document.querySelector('#clear');
  const dataContainer = document.querySelector('.data-container');
  let interval;

  const setActive = () => {
    if (!isActive) {
      startButton.classList.remove('disabled');
      stopButton.classList.add('disabled');
      dataContainer.classList.remove('active');
      clearInterval(interval);
      return;
    }
    startButton.classList.add('disabled');
    stopButton.classList.remove('disabled');
    renderChecksData();
    dataContainer.classList.add('active');
    interval = setInterval(renderChecksData, DELAY);
    return;
  };

  startButton.addEventListener('click', () => {
    isActive = true;
    setActive();
  });
  stopButton.addEventListener('click', () => {
    isActive = false;
    setActive();
  });

  clearButton.addEventListener('click', () => {
    dataContainer.innerHTML = `
      <h3 class="center-align">Nothing to display</h3>
      <p class="center-align">Click <code>Start</code> button to start polling services.</p>
    `;
    isActive = false;
    setActive();
    hideCheckObj();
    dataContainer.classList.remove('active');
  });

  M.AutoInit();
};
