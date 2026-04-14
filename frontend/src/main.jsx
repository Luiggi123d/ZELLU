import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAuthStore } from './store/authStore';
import './index.css';

// Kick off auth hydration before first render so protected routes
// can decide between loading / login / authed immediately.
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
