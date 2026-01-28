import React, { useState, useEffect } from 'react';
import {
  onConfigReceived,
  getConfig,
  isConnected,
  sendMessage,
  testStorageMethods,
  StorageTestResult,
} from './mcp-bridge';

interface Config {
  authUrl: string;
  apiKey: string;
}

// Loading Spinner
function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #e5e7eb', borderTopColor: '#10b981',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280' }}>{message}</p>
      </div>
    </div>
  );
}

// Login Form with Storage Tests
function LoginForm({ config }: { config: Config }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [storageResults, setStorageResults] = useState<StorageTestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      // Perform login
      const res = await fetch(`${config.authUrl}/auth/sign_in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': config.apiKey,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }

      const data = await res.json();
      const token = data.meta?.auth?.access_token;
      if (!token) throw new Error('No access token received');

      // Test all storage methods
      console.log('[Auth] Login successful, testing storage methods...');
      const results = await testStorageMethods(token);
      setStorageResults(results);

      // Send message to Claude about successful login
      if (isConnected()) {
        const workingMethods = [];
        if (results.localStorage) workingMethods.push('localStorage');
        if (results.sessionStorage) workingMethods.push('sessionStorage');
        if (results.broadcastChannel) workingMethods.push('BroadcastChannel');
        if (results.updateModelContext) workingMethods.push('updateModelContext');

        await sendMessage(
          `✅ User logged in successfully as ${email}.\n\n` +
          `Token storage methods tested:\n` +
          `- localStorage: ${results.localStorage ? '✅ WORKS' : '❌ BLOCKED'}\n` +
          `- sessionStorage: ${results.sessionStorage ? '✅ WORKS' : '❌ BLOCKED'}\n` +
          `- BroadcastChannel: ${results.broadcastChannel ? '✅ SENT' : '❌ BLOCKED'}\n` +
          `- updateModelContext: ${results.updateModelContext ? '✅ SENT' : '❌ FAILED'}\n\n` +
          `The auth token has been stored. You can now open other 23blocks apps (forms_dashboard, content_dashboard, etc.) - they should be able to access the token via: ${workingMethods.join(', ') || 'Claude relay'}.`
        );
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 20
      }}>
        <div style={{
          background: 'white', borderRadius: 16, padding: 40,
          width: '100%', maxWidth: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 24, color: '#059669' }}>Login Successful!</h1>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              Your authentication token has been stored.
            </p>
          </div>

          {/* Storage Test Results */}
          {storageResults && (
            <div style={{
              background: '#f0fdf4', borderRadius: 12, padding: 20, marginBottom: 24
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#166534' }}>
                Storage Methods Tested
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StorageResult label="localStorage" works={storageResults.localStorage} />
                <StorageResult label="sessionStorage" works={storageResults.sessionStorage} />
                <StorageResult label="BroadcastChannel" works={storageResults.broadcastChannel} note="(sent)" />
                <StorageResult label="updateModelContext" works={storageResults.updateModelContext} note="(sent to AI)" />
              </div>
            </div>
          )}

          <div style={{
            background: '#f3f4f6', borderRadius: 8, padding: 16, fontSize: 14, color: '#4b5563'
          }}>
            <strong>Next steps:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Ask Claude to open forms_dashboard</li>
              <li>The app should detect your token</li>
              <li>No login required!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 24, color: '#1a1a2e' }}>23blocks Login</h1>
          <p style={{ color: '#6c757d', marginTop: 8 }}>
            Sign in once to access all 23blocks apps
          </p>
          {isConnected() && (
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>✓ Connected to AI</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fee2e2', color: '#dc2626', padding: 12,
              borderRadius: 8, marginBottom: 16, fontSize: 14
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              style={{
                width: '100%', padding: 12, fontSize: 16,
                border: '1px solid #d1d5db', borderRadius: 8
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              style={{
                width: '100%', padding: 12, fontSize: 16,
                border: '1px solid #d1d5db', borderRadius: 8
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: 14, fontSize: 16, fontWeight: 600, color: 'white',
              background: isLoading ? '#6ee7b7' : '#10b981',
              border: 'none', borderRadius: 8,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8,
          fontSize: 13, color: '#6b7280'
        }}>
          <strong>🧪 Experiment:</strong> This app tests different methods to share
          your auth token with other MCP Apps.
        </div>
      </div>
    </div>
  );
}

// Storage result display
function StorageResult({ label, works, note }: { label: string; works: boolean; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{works ? '✅' : '❌'}</span>
      <span style={{ fontSize: 13 }}>{label}</span>
      {note && <span style={{ fontSize: 11, color: '#6b7280' }}>{note}</span>}
    </div>
  );
}

// Check for dev mode
function getDevConfig(): Config | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      const authUrl = params.get('authUrl');
      const apiKey = params.get('apiKey');
      if (authUrl && apiKey) {
        console.log('[App] Running in standalone dev mode');
        return { authUrl, apiKey };
      }
    }
  }
  return null;
}

// Main App
export default function App() {
  const [config, setConfig] = useState<Config | null>(getDevConfig() || getConfig());

  useEffect(() => {
    if (!getDevConfig()) {
      onConfigReceived((newConfig) => {
        console.log('[App] Config received:', newConfig);
        setConfig(newConfig);
      });
    }
  }, []);

  if (!config) {
    return <LoadingSpinner message="Connecting... (add ?dev=true&authUrl=...&apiKey=... for standalone)" />;
  }

  return <LoginForm config={config} />;
}
