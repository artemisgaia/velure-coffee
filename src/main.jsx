import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './admin/AdminApp'
import './index.css' // <--- This line is CRITICAL. It loads the styles.

const path = window.location.pathname;
if (path.startsWith('/admin')) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>,
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
