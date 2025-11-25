import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'antd/dist/reset.css';

/* Bootstrap CSS is loaded conditionally or can be removed if not needed */
/* Most Bootstrap utilities are not used, only Bootstrap Icons are needed */
/* If Bootstrap CSS is required, uncomment the line below */
// import 'bootstrap/dist/css/bootstrap.min.css';

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

