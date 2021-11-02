const bootstrap = () => {
  const body = document.querySelector('body');
  body.insertAdjacentHTML('afterbegin', '<h1>It worked!</h1>');
};

window.onload = bootstrap;
