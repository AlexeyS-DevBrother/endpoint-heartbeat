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
  const tableHtml = `<table>
    <thead>
      <tr>
        <th>Health Check</th>
      </tr>
    </thead>
    <tbody id="data">
      <tr>
        <td><strong>Endpoint</strong></td>
        <td><strong>Status</strong></td>
        <td><strong>Response time</strong></td>
        <td><strong>Timestamp</strong></td>
      </tr>
    </tbody>
  </table>`;
  const dataContainer = document.querySelector('.data-container');
  dataContainer.innerHTML = '';
  dataContainer.insertAdjacentHTML('beforeend', tableHtml);

  let tableRows = '';
  for (const check of checks) {
    const { endpoint, responseTime, status, timestamp } = check;
    const str = `<tr>
      <td class="service-endpoint">${endpoint}</td>
      <td class="service-status">${status}</td>
      <td class="service-responseTime">${responseTime}</td>
      <td class="service-timestamp">${new Date(timestamp)}</td>
    </tr>`;
    tableRows += str;
  }
  const target = document.querySelector('#data');
  target.insertAdjacentHTML('beforeend', tableRows);
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
  });
};
