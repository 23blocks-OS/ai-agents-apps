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
      if (isConnected()) {
        sendMessage(`User logged in successfully as ${email}. The Forms Dashboard is now displayed. I can interact with forms directly through this interface - do NOT use browser automation.`);
      }
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

// Lead Card with AI Action Buttons
function LeadCard({ lead, index, formName }: { lead: Lead; index: number; formName: string }) {
  const [showActions, setShowActions] = useState(false);

  const leadSummary = () => {
    const parts = [];
    if (lead.data?.name) parts.push(`Name: ${lead.data.name}`);
    if (lead.data?.email) parts.push(`Email: ${lead.data.email}`);
    if (lead.data?.phone) parts.push(`Phone: ${lead.data.phone}`);
    if (lead.data?.company) parts.push(`Company: ${lead.data.company}`);
    if (lead.data?.message) parts.push(`Message: ${lead.data.message}`);
    // Include any other fields
    Object.entries(lead.data || {}).forEach(([key, value]) => {
      if (!['name', 'email', 'phone', 'company', 'message'].includes(key) && value) {
        parts.push(`${key}: ${value}`);
      }
    });
    return parts.join('\n');
  };

  const handleAction = (action: string) => {
    if (!isConnected()) return;
    const summary = leadSummary();

    switch (action) {
      case 'research':
        sendMessage(`Please research this lead from the "${formName}" form:\n\n${summary}\n\nFind information about this person/company online - LinkedIn, company website, news, etc.`);
        break;
      case 'crm':
        sendMessage(`Please add this lead to my CRM:\n\n${summary}\n\nSource: ${formName} form\nDate: ${lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Unknown'}`);
        break;
      case 'email':
        sendMessage(`Please draft a follow-up email for this lead:\n\n${summary}\n\nThis lead came from the "${formName}" form. Draft a professional, personalized response.`);
        break;
      case 'summary':
        sendMessage(`Here's a lead from the "${formName}" form:\n\n${summary}\n\nWhat would you like me to do with this lead?`);
        break;
    }
    setShowActions(false);
  };

  const actionButtonStyle = {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{lead.data?.name || lead.data?.email || `Lead #${index + 1}`}</div>
          {lead.data?.email && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>✉️ {lead.data.email}</div>}
          {lead.data?.phone && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>📱 {lead.data.phone}</div>}
          {lead.data?.company && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>🏢 {lead.data.company}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lead.created_at && <div style={{ fontSize: 13, color: '#9ca3af' }}>{new Date(lead.created_at).toLocaleDateString()}</div>}
          {isConnected() && (
            <button
              onClick={() => setShowActions(!showActions)}
              style={{
                padding: '6px 10px',
                fontSize: 14,
                background: showActions ? '#eef2ff' : '#f3f4f6',
                color: showActions ? '#667eea' : '#6b7280',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              title="AI Actions"
            >
              🤖
            </button>
          )}
        </div>
      </div>

      {/* AI Action Buttons */}
      {showActions && isConnected() && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <button
            onClick={() => handleAction('research')}
            style={{ ...actionButtonStyle, background: '#dbeafe', color: '#1d4ed8' }}
          >
            🔍 Research
          </button>
          <button
            onClick={() => handleAction('crm')}
            style={{ ...actionButtonStyle, background: '#dcfce7', color: '#15803d' }}
          >
            📇 Add to CRM
          </button>
          <button
            onClick={() => handleAction('email')}
            style={{ ...actionButtonStyle, background: '#fef3c7', color: '#b45309' }}
          >
            ✉️ Draft Email
          </button>
          <button
            onClick={() => handleAction('summary')}
            style={{ ...actionButtonStyle, background: '#f3e8ff', color: '#7c3aed' }}
          >
            💬 Ask AI
          </button>
        </div>
      )}
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
      if (isConnected()) {
        const leadCount = data.data?.length || 0;
        sendMessage(`Now viewing ${leadCount} leads for form "${name}". The user can see the lead details in the dashboard.`);
      }
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
      if (isConnected()) {
        sendMessage(`Successfully created new form: "${formName}". It now appears in the forms list.`);
      }
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
                      <LeadCard key={l.id || i} lead={l} index={i} formName={selectedFormName} />
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

// Check for standalone dev mode via URL params or env
function getDevConfig(): Config | null {
  // Check URL params: ?dev=true&apiUrl=...&authUrl=...&apiKey=...
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      const apiUrl = params.get('apiUrl') || import.meta.env.VITE_API_URL;
      const authUrl = params.get('authUrl') || import.meta.env.VITE_AUTH_URL;
      const apiKey = params.get('apiKey') || import.meta.env.VITE_API_KEY;
      if (apiUrl && authUrl && apiKey) {
        console.log('[App] Running in standalone dev mode');
        return { apiUrl, authUrl, apiKey };
      }
    }
  }
  return null;
}

// Main App
export default function App() {
  const [config, setConfig] = useState<Config | null>(getDevConfig() || getConfig());

  useEffect(() => {
    // Listen for config from tool result (only if not in dev mode)
    if (!getDevConfig()) {
      onConfigReceived((newConfig) => {
        console.log('[App] Config received:', newConfig);
        setConfig(newConfig);
      });
    }
  }, []);

  // If no config yet, show loading (waiting for tool result)
  if (!config) {
    return <LoadingSpinner message="Connecting... (add ?dev=true&apiUrl=...&authUrl=...&apiKey=... for standalone testing)" />;
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
