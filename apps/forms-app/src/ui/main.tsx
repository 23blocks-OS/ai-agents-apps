import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@23blocks/shared-ui';
import { AuthProvider } from './context/AuthContext';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
