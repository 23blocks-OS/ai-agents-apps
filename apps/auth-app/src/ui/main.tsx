import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initMcpApp } from './mcp-bridge';

// Initialize MCP connection
initMcpApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
