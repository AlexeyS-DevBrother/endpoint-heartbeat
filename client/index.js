let isActive = false;
const DELAY = 15000;

const getChecks = async () => {
  const select = document.querySelector('select');
  const { value: exchange } = select;
  const response = await fetch(`/api/checks?exchange=${exchange}`);
  return response.json();
};

const renderChecksData = async () => {
  const checks = await getChecks();
  const head = `
    <div class="col"><strong>Endpoint</strong></div>
    <div class="col"><strong>Status</strong></div>
    <div class="col"><strong>Response Time</strong></div>
    <div class="col"><strong>Date</strong></div>
    <div class="col"><strong>Time</strong></div>
    <div class="col"><strong>Response</strong></div>
    <div class="col"><strong>Request</strong></div>`;
  const dataContainer = document.querySelector('.data-container');
  dataContainer.innerHTML = '';
  dataContainer.insertAdjacentHTML('beforeend', head);
  let tableRows = '';
  for (const check of checks) {
    const { endpoint, responseTime, status, timestamp } = check;
    const rawDate = new Date(timestamp);
    const date = rawDate.toLocaleDateString();
    const time = rawDate.toLocaleTimeString();
    const str = `
      <div class="col">${endpoint}</div>
      <div class="col">${status}</div>
      <div class="col">${responseTime}</div>
      <div class="col">${date}</div>
      <div class="col">${time}</div>
      <div class="col">
        <a class="check-object" data-endpoint="${endpoint}" data-type="response" href="#">
          see object
        </a>
      </div>
      <div class="col">
        <a class="check-object" data-endpoint="${endpoint}" data-type="request" href="#">
          see object
        </a>
      </div>`; // /request?url='${endpoint}'
    tableRows += str;
  }
  dataContainer.insertAdjacentHTML('beforeend', tableRows);
  const checkObjects = document.querySelectorAll('.check-object');
  checkObjects.forEach((checkObject) =>
    checkObject.addEventListener('click', ({ target }) => {
      const { endpoint, type } = target.dataset;
      const check = checks.find((check) => check.endpoint === endpoint);
      console.log(check[type]);
    }),
  );
};

window.onload = () => {
  const controlButton = document.querySelector('.control-button');
  const clearButton = document.querySelector('.clear');
  const dataContainer = document.querySelector('.data-container');
  let interval;

  const stop = (classList, button) => {
    classList.remove('stop');
    clearInterval(interval);
    button.textContent = 'Get results';
  };

  const setActive = (classList, button) => {
    classList.add('stop');
    button.textContent = 'Stop';
    renderChecksData();
    dataContainer.classList.add('active');
    interval = setInterval(renderChecksData, DELAY);
  };

  controlButton.addEventListener('click', () => {
    const { classList } = controlButton;
    isActive = !isActive;
    isActive
      ? setActive(classList, controlButton)
      : stop(classList, controlButton);
  });

  clearButton.addEventListener('click', () => {
    dataContainer.innerHTML = `
      <h4>Nothing to display</h4>
      <p>Click <code>Get results</code> button to start polling services.</p>
    `;
    isActive = false;
    stop(controlButton.classList, controlButton);
    dataContainer.classList.remove('active');
  });
};
