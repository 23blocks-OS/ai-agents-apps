import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@23blocks/shared-ui';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
