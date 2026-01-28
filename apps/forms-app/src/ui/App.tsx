import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { onConfigReceived, getConfig, isConnected, sendMessage } from './mcp-bridge';

// Types
interface Config {
  apiUrl: string;
  authUrl: string;
  apiKey: string;
}

interface AuthState {
  token: string | null;
  user: { email: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface Form {
  id: string;
  name: string;
  form_type: string;
}

interface Lead {
  id: string;
  data: any;
  created_at: string;
}

// Config Context
const ConfigContext = createContext<Config | null>(null);
const useConfig = () => useContext(ConfigContext);

// Auth Context
const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);
const useAuth = () => useContext(AuthContext);

// Auth Provider
function AuthProvider({ children, config }: { children: React.ReactNode; config: Config }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch(`${config.authUrl}/auth/sign_in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'AppId': config.apiKey },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Login failed');
      }
      const data = await res.json();
      const token = data.meta?.auth?.access_token;
      if (!token) throw new Error('No access token');
      setState({
        token,
        user: data.data?.attributes || { email },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      if (isConnected()) sendMessage(`User logged in as ${email}`);
    } catch (err: any) {
      setState(s => ({ ...s, isLoading: false, error: err.message }));
    }
  }, [config]);

  const logout = useCallback(() => {
    setState({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
    if (isConnected()) sendMessage('User logged out');
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Loading Spinner
function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #e5e7eb', borderTopColor: '#667eea',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280' }}>{message}</p>
      </div>
    </div>
  );
}

// Login Form
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth()!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) await auth.login(email, password);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h1 style={{ fontSize: 24, color: '#1a1a2e' }}>Forms Dashboard</h1>
          <p style={{ color: '#6c757d', marginTop: 8 }}>Sign in to manage your forms</p>
          {isConnected() && (
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>✓ Connected to AI</p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          {auth.state.error && (
            <div style={{
              background: '#fee2e2', color: '#dc2626', padding: 12,
              borderRadius: 8, marginBottom: 16, fontSize: 14
            }}>{auth.state.error}</div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required disabled={auth.state.isLoading}
              style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #d1d5db', borderRadius: 8 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required disabled={auth.state.isLoading}
              style={{ width: '100%', padding: 12, fontSize: 16, border: '1px solid #d1d5db', borderRadius: 8 }}
            />
          </div>
          <button
            type="submit" disabled={auth.state.isLoading}
            style={{
              width: '100%', padding: 14, fontSize: 16, fontWeight: 600, color: 'white',
              background: auth.state.isLoading ? '#a5b4fc' : '#667eea',
              border: 'none', borderRadius: 8, cursor: auth.state.isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {auth.state.isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard() {
  const config = useConfig()!;
  const auth = useAuth()!;
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [view, setView] = useState<'leads' | 'create'>('leads');
  const [createData, setCreateData] = useState({ name: '', form_type: 'landing' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/forms`, {
        headers: { 'AppId': config.apiKey, 'Authorization': `Bearer ${auth.state.token}` }
      });
      if (res.status === 401) { auth.logout(); return; }
      const data = await res.json();
      setForms((data.data || []).map((f: any) => ({
        id: f.id,
        name: f.attributes?.name || f.name,
        form_type: f.attributes?.form_type || f.form_type || 'landing'
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchLeads = async (id: string, name: string) => {
    setLoadingLeads(true);
    setSelectedForm(id);
    setSelectedFormName(name);
    try {
      const res = await fetch(`${config.apiUrl}/landing_forms?form_id=${id}`, {
        headers: { 'AppId': config.apiKey, 'Authorization': `Bearer ${auth.state.token}` }
      });
      const data = await res.json();
      setLeads((data.data || []).map((l: any) => ({
        id: l.id,
        data: l.data || l.attributes?.data,
        created_at: l.created_at || l.attributes?.created_at
      })));
      if (isConnected()) sendMessage(`Viewing ${data.data?.length || 0} leads for "${name}"`);
    } catch (e) { console.error(e); }
    setLoadingLeads(false);
  };

  const createForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.name.trim()) return;
    setCreating(true);
    try {
      const code = createData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      await fetch(`${config.apiUrl}/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': config.apiKey,
          'Authorization': `Bearer ${auth.state.token}`
        },
        body: JSON.stringify({ ...createData, code })
      });
      const formName = createData.name;
      setCreateData({ name: '', form_type: 'landing' });
      fetchForms();
      setView('leads');
      if (isConnected()) sendMessage(`Created form: "${formName}"`);
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📋</span>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>23blocks Forms</h1>
            {isConnected() && (
              <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 4 }}>AI</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>{auth.state.user?.email}</span>
            <button
              onClick={auth.logout}
              style={{ padding: '8px 16px', fontSize: 14, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >Logout</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('leads')}
            style={{
              padding: '12px 20px', fontSize: 14, fontWeight: 500,
              color: view === 'leads' ? '#667eea' : '#6b7280',
              background: 'none', border: 'none',
              borderBottom: view === 'leads' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1
            }}
          >📬 Leads</button>
          <button
            onClick={() => setView('create')}
            style={{
              padding: '12px 20px', fontSize: 14, fontWeight: 500,
              color: view === 'create' ? '#667eea' : '#6b7280',
              background: 'none', border: 'none',
              borderBottom: view === 'create' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1
            }}
          >✨ Create</button>
        </div>
      </header>

      {/* Content */}
      {view === 'create' ? (
        <div style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Create Form</h2>
            <form onSubmit={createForm}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Name</label>
                <input
                  type="text" value={createData.name}
                  onChange={e => setCreateData({ ...createData, name: e.target.value })}
                  required disabled={creating}
                  style={{ width: '100%', padding: 12, fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8 }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Type</label>
                <select
                  value={createData.form_type}
                  onChange={e => setCreateData({ ...createData, form_type: e.target.value })}
                  disabled={creating}
                  style={{ width: '100%', padding: 12, fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8, background: 'white' }}
                >
                  <option value="landing">📬 Landing</option>
                  <option value="survey">📊 Survey</option>
                  <option value="appointment">📅 Appointment</option>
                </select>
              </div>
              <button
                type="submit" disabled={creating}
                style={{
                  width: '100%', padding: 14, fontSize: 16, fontWeight: 600, color: 'white',
                  background: creating ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none', borderRadius: 8, cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >{creating ? 'Creating...' : 'Create'}</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', height: 'calc(100vh - 113px)' }}>
          {/* Sidebar */}
          <div style={{ width: 280, background: 'white', borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>
              Forms
            </div>
            {forms.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No forms</div>
            ) : (
              forms.map(f => (
                <div
                  key={f.id}
                  onClick={() => fetchLeads(f.id, f.name)}
                  style={{
                    padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                    background: selectedForm === f.id ? '#eef2ff' : 'white',
                    borderLeft: selectedForm === f.id ? '3px solid #667eea' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{f.form_type}</div>
                </div>
              ))
            )}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'auto', background: '#f9fafb', padding: 24 }}>
            {!selectedForm ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📬</div>
                <p>Select a form to view leads</p>
              </div>
            ) : loadingLeads ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{
                  width: 40, height: 40,
                  border: '3px solid #e5e7eb', borderTopColor: '#667eea',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto'
                }} />
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>{selectedFormName}</h2>
                {leads.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <p>No leads yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leads.map((l, i) => (
                      <div key={l.id || i} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{l.data?.name || l.data?.email || `Lead #${i + 1}`}</div>
                            {l.data?.email && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>✉️ {l.data.email}</div>}
                            {l.data?.phone && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>📱 {l.data.phone}</div>}
                          </div>
                          {l.created_at && <div style={{ fontSize: 13, color: '#9ca3af' }}>{new Date(l.created_at).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main App
export default function App() {
  const [config, setConfig] = useState<Config | null>(getConfig());

  useEffect(() => {
    // Listen for config from tool result
    onConfigReceived((newConfig) => {
      console.log('[App] Config received:', newConfig);
      setConfig(newConfig);
    });
  }, []);

  // If no config yet, show loading (waiting for tool result)
  if (!config) {
    return <LoadingSpinner message="Connecting..." />;
  }

  return (
    <ConfigContext.Provider value={config}>
      <AuthProvider config={config}>
        <AppContent />
      </AuthProvider>
    </ConfigContext.Provider>
  );
}

function AppContent() {
  const auth = useAuth()!;
  return auth.state.isAuthenticated ? <Dashboard /> : <LoginForm />;
}
