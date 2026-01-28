import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initMcpApp } from './mcp-bridge';

// Initialize MCP App connection first
initMcpApp().then(() => {
  console.log('[Forms App] MCP initialization complete');
});

// Render the app
const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
