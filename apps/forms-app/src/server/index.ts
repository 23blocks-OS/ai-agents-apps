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

    // Date helpers
    const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return getStartOfDay(new Date(d.setDate(diff)));
    };
    const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

    const DATE_FILTERS = [
      { key: 'today', label: 'Today', getStart: () => getStartOfDay(new Date()) },
      { key: 'week', label: 'This Week', getStart: () => getStartOfWeek(new Date()) },
      { key: 'month', label: 'This Month', getStart: () => getStartOfMonth(new Date()) },
      { key: 'all', label: 'All Time', getStart: () => null },
    ];

    // Extract common lead fields
    const extractLeadInfo = (lead) => {
      const data = lead.data || lead;
      const findField = (keys) => {
        for (const key of keys) {
          const val = data[key] || data[key.toLowerCase()] || data[key.toUpperCase()];
          if (val) return val;
        }
        return null;
      };
      return {
        name: findField(['name', 'full_name', 'fullName', 'nombre', 'first_name', 'firstName']) || findField(['last_name', 'lastName']) || 'Unknown',
        email: findField(['email', 'correo', 'e-mail', 'emailAddress']),
        phone: findField(['phone', 'telefono', 'tel', 'mobile', 'phoneNumber', 'celular']),
        company: findField(['company', 'empresa', 'organization', 'companyName']),
        message: findField(['message', 'mensaje', 'comments', 'comentarios', 'notes']),
        createdAt: lead.created_at,
        id: lead.id,
        rawData: data
      };
    };

    // Dashboard
    function Dashboard() {
      const { token, user, logout } = useAuth();
      const [forms, setForms] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedForm, setSelectedForm] = useState(null);
      const [selectedFormName, setSelectedFormName] = useState('');
      const [leads, setLeads] = useState([]);
      const [loadingLeads, setLoadingLeads] = useState(false);
      const [dateFilter, setDateFilter] = useState('all');
      const [expandedLead, setExpandedLead] = useState(null);

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

      const fetchLeads = async (formId, formName) => {
        setLoadingLeads(true);
        setSelectedForm(formId);
        setSelectedFormName(formName);
        setExpandedLead(null);
        try {
          const res = await fetch(API_URL + '/api/v1/landing_forms?form_id=' + formId, {
            headers: { 'AppId': API_KEY, 'Authorization': 'Bearer ' + token },
          });
          if (res.status === 401) { logout(); return; }
          const data = await res.json();
          const rawLeads = data.data || data || [];
          setLeads(rawLeads.map(extractLeadInfo));
        } catch (err) {
          console.error('Failed to fetch leads:', err);
        } finally {
          setLoadingLeads(false);
        }
      };

      // Filter leads by date
      const filterConfig = DATE_FILTERS.find(f => f.key === dateFilter);
      const filterStart = filterConfig?.getStart();
      const filteredLeads = filterStart
        ? leads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= filterStart)
        : leads;

      // Count per filter
      const getCounts = () => DATE_FILTERS.map(f => {
        const start = f.getStart();
        const count = start
          ? leads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= start).length
          : leads.length;
        return { ...f, count };
      });

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
            h('h1', { style: { fontSize: '20px', fontWeight: 600, color: '#1f2937' } }, 'Website Leads')
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
            h('span', { style: { fontSize: '14px', color: '#6b7280' } }, user?.email),
            h('button', { onClick: logout, style: { padding: '8px 16px', fontSize: '14px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Logout')
          )
        ),
        // Content
        h('div', { style: { display: 'flex', height: 'calc(100vh - 65px)' } },
          // Forms List
          h('div', { style: { width: '300px', background: 'white', borderRight: '1px solid #e5e7eb', overflow: 'auto' } },
            h('div', { style: { padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' } }, 'Your Forms'),
            forms.length === 0
              ? h('div', { style: { padding: '40px', textAlign: 'center', color: '#6b7280' } },
                  h('div', { style: { fontSize: '32px', marginBottom: '8px' } }, '📝'),
                  h('p', null, 'No forms yet')
                )
              : forms.map(form =>
                  h('div', {
                    key: form.id,
                    onClick: () => fetchLeads(form.id, form.name),
                    style: {
                      padding: '14px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: selectedForm === form.id ? '#eef2ff' : 'white',
                      borderLeft: selectedForm === form.id ? '3px solid #667eea' : '3px solid transparent'
                    }
                  },
                    h('div', { style: { fontWeight: 500, color: '#1f2937', fontSize: '14px' } }, form.name),
                    h('div', { style: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' } }, form.form_type || 'landing')
                  )
                )
          ),
          // Leads Panel
          h('div', { style: { flex: 1, overflow: 'auto', background: '#f9fafb' } },
            !selectedForm
              ? h('div', { style: { textAlign: 'center', padding: '80px', color: '#6b7280' } },
                  h('div', { style: { fontSize: '64px', marginBottom: '16px' } }, '📬'),
                  h('h2', { style: { fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: '8px' } }, 'Select a form'),
                  h('p', null, 'Choose a form from the list to view leads')
                )
              : loadingLeads
                ? h('div', { style: { textAlign: 'center', padding: '80px' } },
                    h('div', { style: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' } }),
                    h('p', { style: { color: '#6b7280' } }, 'Loading leads...')
                  )
                : h('div', { style: { padding: '24px' } },
                    // Form name & date filters
                    h('div', { style: { marginBottom: '20px' } },
                      h('h2', { style: { fontSize: '22px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' } }, selectedFormName),
                      h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                        getCounts().map(f =>
                          h('button', {
                            key: f.key,
                            onClick: () => setDateFilter(f.key),
                            style: {
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: 500,
                              border: 'none',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              background: dateFilter === f.key ? '#667eea' : 'white',
                              color: dateFilter === f.key ? 'white' : '#4b5563',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }
                          }, f.label + ' (' + f.count + ')')
                        )
                      )
                    ),
                    // Leads list
                    filteredLeads.length === 0
                      ? h('div', { style: { background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#6b7280' } },
                          h('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📭'),
                          h('p', { style: { fontSize: '16px' } }, 'No leads ' + (dateFilter !== 'all' ? 'for this period' : 'yet'))
                        )
                      : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
                          filteredLeads.map((lead, i) =>
                            h('div', {
                              key: lead.id || i,
                              style: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                            },
                              // Lead header
                              h('div', {
                                onClick: () => setExpandedLead(expandedLead === lead.id ? null : lead.id),
                                style: { padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }
                              },
                                // Avatar
                                h('div', { style: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '16px', flexShrink: 0 } },
                                  (lead.name || '?').charAt(0).toUpperCase()
                                ),
                                // Info
                                h('div', { style: { flex: 1, minWidth: 0 } },
                                  h('div', { style: { fontWeight: 600, color: '#1f2937', fontSize: '15px' } }, lead.name),
                                  h('div', { style: { display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' } },
                                    lead.email && h('span', { style: { fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' } }, '✉️ ', lead.email),
                                    lead.phone && h('span', { style: { fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' } }, '📱 ', lead.phone)
                                  )
                                ),
                                // Date
                                h('div', { style: { textAlign: 'right', flexShrink: 0 } },
                                  h('div', { style: { fontSize: '13px', color: '#6b7280' } }, lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''),
                                  h('div', { style: { fontSize: '12px', color: '#9ca3af' } }, lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
                                ),
                                // Expand icon
                                h('div', { style: { color: '#9ca3af', fontSize: '12px', marginLeft: '8px' } }, expandedLead === lead.id ? '▼' : '▶')
                              ),
                              // Expanded details
                              expandedLead === lead.id && h('div', { style: { padding: '0 20px 20px', borderTop: '1px solid #f3f4f6' } },
                                lead.company && h('div', { style: { marginTop: '12px' } },
                                  h('span', { style: { fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' } }, 'Company'),
                                  h('p', { style: { marginTop: '4px', color: '#1f2937' } }, lead.company)
                                ),
                                lead.message && h('div', { style: { marginTop: '12px' } },
                                  h('span', { style: { fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' } }, 'Message'),
                                  h('p', { style: { marginTop: '4px', color: '#1f2937', whiteSpace: 'pre-wrap' } }, lead.message)
                                ),
                                h('div', { style: { marginTop: '16px' } },
                                  h('details', null,
                                    h('summary', { style: { fontSize: '12px', color: '#9ca3af', cursor: 'pointer' } }, 'View raw data'),
                                    h('pre', { style: { marginTop: '8px', fontSize: '11px', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' } },
                                      JSON.stringify(lead.rawData, null, 2)
                                    )
                                  )
                                )
                              )
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
