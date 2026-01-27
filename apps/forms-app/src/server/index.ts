/**
 * 23blocks Forms App - MCP Server
 *
 * Provides interactive UIs for Forms Block:
 * - Login & Authentication
 * - Forms Dashboard
 * - Create Form
 * - View Form Instances (submissions)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Get environment variables
const API_URL = process.env.BLOCKS_API_URL || '';
const API_KEY = process.env.BLOCKS_API_KEY || '';

if (!API_URL || !API_KEY) {
  console.error("ERROR: Missing BLOCKS_API_URL or BLOCKS_API_KEY environment variables");
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: "23blocks-forms-app",
  version: "0.1.0"
});

// Tool: Forms Dashboard
server.tool(
  "forms_dashboard",
  "Open the forms management dashboard with login. Lists all forms and allows creating new ones.",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Forms Dashboard..." }],
      _meta: { ui: { resourceUri: "ui://forms/app" } }
    };
  }
);

// Tool: Create Form
server.tool(
  "create_form",
  "Open the form creation interface to create a new form",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Form Creator..." }],
      _meta: { ui: { resourceUri: "ui://forms/app?view=create" } }
    };
  }
);

// Tool: View Form Instances
server.tool(
  "form_instances",
  "View all submitted instances (responses) for a specific form",
  {
    type: "object",
    properties: {
      form_id: {
        type: "string",
        description: "Form ID to view instances for"
      }
    },
    required: ["form_id"]
  },
  async (args) => {
    const formId = (args as { form_id: string }).form_id;

    return {
      content: [{ type: "text", text: `Loading instances for form ${formId}...` }],
      _meta: { ui: { resourceUri: `ui://forms/app?view=instances&form_id=${formId}` } }
    };
  }
);

// Main UI Resource - serves the React app with config injected
server.resource(
  "ui://forms/app",
  "Forms management application",
  async () => ({
    contents: [{
      uri: "ui://forms/app",
      mimeType: "text/html",
      text: getAppHtml()
    }]
  })
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("23blocks Forms App server running on stdio");
}

main().catch(console.error);

// HTML template with injected config
function getAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>23blocks Forms</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <script>
    // Inject API configuration from server
    window.__BLOCKS_API_URL__ = "${API_URL}";
    window.__BLOCKS_API_KEY__ = "${API_KEY}";
  </script>
</head>
<body>
  <div id="root">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#667eea;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
        <p style="color:#6b7280;">Loading...</p>
      </div>
    </div>
  </div>
  <script type="module">
    // Simple standalone app - no build step needed for now
    const { createElement: h, useState, useEffect, useCallback, useContext, createContext } = await import('https://esm.sh/react@18');
    const { createRoot } = await import('https://esm.sh/react-dom@18/client');

    const API_URL = window.__BLOCKS_API_URL__;
    const API_KEY = window.__BLOCKS_API_KEY__;

    // Auth Context
    const AuthContext = createContext(null);

    function AuthProvider({ children }) {
      const [state, setState] = useState({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      const login = useCallback(async (email, password) => {
        setState(s => ({ ...s, isLoading: true, error: null }));
        try {
          const res = await fetch(API_URL + '/api/v1/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'AppId': API_KEY },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || 'Login failed');
          }
          const data = await res.json();
          const token = data.token || data.access_token || data.data?.token;
          const user = data.user || data.data?.user || { email };
          setState({ token, user, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (err) {
          setState(s => ({ ...s, isLoading: false, error: err.message }));
          return false;
        }
      }, []);

      const logout = useCallback(() => {
        setState({ token: null, user: null, isAuthenticated: false, isLoading: false, error: null });
      }, []);

      return h(AuthContext.Provider, { value: { ...state, login, logout } }, children);
    }

    function useAuth() {
      return useContext(AuthContext);
    }

    // Login Form
    function LoginForm() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const { login, isLoading, error } = useAuth();

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (email && password) await login(email, password);
      };

      return h('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' } },
        h('div', { style: { background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } },
          h('div', { style: { textAlign: 'center', marginBottom: '32px' } },
            h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📋'),
            h('h1', { style: { fontSize: '24px', color: '#1a1a2e' } }, 'Forms Dashboard'),
            h('p', { style: { color: '#6c757d', marginTop: '8px' } }, 'Sign in to manage your forms')
          ),
          h('form', { onSubmit: handleSubmit },
            error && h('div', { style: { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' } }, error),
            h('div', { style: { marginBottom: '16px' } },
              h('label', { style: { display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' } }, 'Email'),
              h('input', { type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'you@example.com', required: true, disabled: isLoading, style: { width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' } })
            ),
            h('div', { style: { marginBottom: '24px' } },
              h('label', { style: { display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' } }, 'Password'),
              h('input', { type: 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: '••••••••', required: true, disabled: isLoading, style: { width: '100%', padding: '12px 16px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' } })
            ),
            h('button', { type: 'submit', disabled: isLoading, style: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: 'white', background: isLoading ? '#a5b4fc' : '#667eea', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer' } },
              isLoading ? 'Signing in...' : 'Sign In'
            )
          )
        )
      );
    }

    // Dashboard
    function Dashboard() {
      const { token, user, logout } = useAuth();
      const [forms, setForms] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedForm, setSelectedForm] = useState(null);
      const [instances, setInstances] = useState([]);
      const [loadingInstances, setLoadingInstances] = useState(false);

      useEffect(() => {
        fetchForms();
      }, [token]);

      const fetchForms = async () => {
        setLoading(true);
        try {
          const res = await fetch(API_URL + '/api/v1/forms', {
            headers: { 'AppId': API_KEY, 'Authorization': 'Bearer ' + token },
          });
          if (res.status === 401) { logout(); return; }
          const data = await res.json();
          setForms(data.data || data || []);
        } catch (err) {
          console.error('Failed to fetch forms:', err);
        } finally {
          setLoading(false);
        }
      };

      const fetchInstances = async (formId) => {
        setLoadingInstances(true);
        setSelectedForm(formId);
        try {
          const res = await fetch(API_URL + '/api/v1/landing_forms?form_id=' + formId, {
            headers: { 'AppId': API_KEY, 'Authorization': 'Bearer ' + token },
          });
          if (res.status === 401) { logout(); return; }
          const data = await res.json();
          setInstances(data.data || data || []);
        } catch (err) {
          console.error('Failed to fetch instances:', err);
        } finally {
          setLoadingInstances(false);
        }
      };

      if (loading) {
        return h('div', { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          h('div', { style: { textAlign: 'center' } },
            h('div', { style: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' } }),
            h('p', { style: { color: '#6b7280' } }, 'Loading forms...')
          )
        );
      }

      return h('div', { style: { minHeight: '100vh', background: '#f5f5f5' } },
        // Header
        h('header', { style: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
            h('span', { style: { fontSize: '24px' } }, '📋'),
            h('h1', { style: { fontSize: '20px', fontWeight: 600, color: '#1f2937' } }, 'Forms Dashboard')
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
            h('span', { style: { fontSize: '14px', color: '#6b7280' } }, user?.email),
            h('button', { onClick: logout, style: { padding: '8px 16px', fontSize: '14px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Logout')
          )
        ),
        // Content
        h('div', { style: { display: 'flex', height: 'calc(100vh - 65px)' } },
          // Forms List
          h('div', { style: { width: '350px', background: 'white', borderRight: '1px solid #e5e7eb', overflow: 'auto' } },
            h('div', { style: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 } }, 'Your Forms (' + forms.length + ')'),
            forms.length === 0
              ? h('div', { style: { padding: '40px', textAlign: 'center', color: '#6b7280' } },
                  h('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📝'),
                  h('p', null, 'No forms yet')
                )
              : forms.map(form =>
                  h('div', {
                    key: form.id,
                    onClick: () => fetchInstances(form.id),
                    style: {
                      padding: '16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: selectedForm === form.id ? '#eef2ff' : 'white'
                    }
                  },
                    h('div', { style: { fontWeight: 500, color: '#1f2937' } }, form.name),
                    h('div', { style: { fontSize: '13px', color: '#6b7280', marginTop: '4px' } }, form.form_type || 'form')
                  )
                )
          ),
          // Instances Panel
          h('div', { style: { flex: 1, overflow: 'auto', padding: '24px' } },
            !selectedForm
              ? h('div', { style: { textAlign: 'center', padding: '60px', color: '#6b7280' } },
                  h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '👈'),
                  h('p', null, 'Select a form to view submissions')
                )
              : loadingInstances
                ? h('div', { style: { textAlign: 'center', padding: '60px' } },
                    h('div', { style: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' } }),
                    h('p', { style: { color: '#6b7280' } }, 'Loading submissions...')
                  )
                : h('div', null,
                    h('h2', { style: { fontSize: '18px', fontWeight: 600, marginBottom: '16px' } }, 'Submissions (' + instances.length + ')'),
                    instances.length === 0
                      ? h('div', { style: { background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6b7280' } },
                          h('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📭'),
                          h('p', null, 'No submissions yet')
                        )
                      : instances.map((inst, i) =>
                          h('div', {
                            key: inst.id || i,
                            style: { background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                          },
                            h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' } },
                              h('span', { style: { fontWeight: 500 } }, '#' + (inst.id || i + 1)),
                              h('span', { style: { fontSize: '13px', color: '#6b7280' } }, inst.created_at ? new Date(inst.created_at).toLocaleString() : '')
                            ),
                            h('pre', { style: { fontSize: '13px', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' } },
                              JSON.stringify(inst.data || inst, null, 2)
                            )
                          )
                        )
                  )
          )
        )
      );
    }

    // App
    function App() {
      const { isAuthenticated } = useAuth();
      return isAuthenticated ? h(Dashboard) : h(LoginForm);
    }

    // Mount
    const root = createRoot(document.getElementById('root'));
    root.render(h(AuthProvider, null, h(App)));
  </script>
</body>
</html>`;
}
