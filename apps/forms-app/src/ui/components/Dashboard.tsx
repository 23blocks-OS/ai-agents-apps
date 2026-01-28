import React, { useState, useEffect } from 'react';
import { useAuth, useFormsBlock } from '@23blocks/react';

// Use SDK types or flexible types
interface FormData {
  id: string;
  name: string;
  form_type: string;
  status: string;
  created_at: string;
  code?: string;
  [key: string]: any;
}

interface LeadData {
  id: string;
  data: Record<string, any>;
  created_at: string;
  [key: string]: any;
}

// Date helpers
const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return getStartOfDay(new Date(d.setDate(diff)));
};
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const DATE_FILTERS = [
  { key: 'today', label: 'Today', getStart: () => getStartOfDay(new Date()) },
  { key: 'week', label: 'This Week', getStart: () => getStartOfWeek(new Date()) },
  { key: 'month', label: 'This Month', getStart: () => getStartOfMonth(new Date()) },
  { key: 'all', label: 'All Time', getStart: () => null as Date | null },
];

// Extract common lead fields
const extractLeadInfo = (lead: LeadData) => {
  const data = lead.data || lead;
  const findField = (keys: string[]) => {
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

export function Dashboard() {
  const { signOut, getCurrentUser } = useAuth();
  const formsBlock = useFormsBlock();

  const [user, setUser] = useState<any>(null);
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log formsBlock to debug
  useEffect(() => {
    console.log('formsBlock:', formsBlock);
    console.log('formsBlock.forms:', formsBlock?.forms);
  }, [formsBlock]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [selectedFormName, setSelectedFormName] = useState('');
  const [leads, setLeads] = useState<ReturnType<typeof extractLeadInfo>[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  // Create form state
  const [view, setView] = useState<'leads' | 'create'>('leads');
  const [createFormData, setCreateFormData] = useState({ name: '', form_type: 'landing', description: '', status: 'active' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser((currentUser as any)?.data?.attributes || (currentUser as any)?.attributes || currentUser);
      await fetchForms();
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setError(err?.message || 'Failed to load data');
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    setError(null);

    if (!formsBlock?.forms) {
      setError('Forms service not available. Check API configuration.');
      setLoading(false);
      return;
    }

    try {
      console.log('Calling formsBlock.forms.list()...');
      const response = await formsBlock.forms.list();
      console.log('Forms response:', response);
      // Transform SDK response to our format
      const formsData = (response?.data || []).map((f: any) => ({
        id: f.id,
        name: f.name || f.attributes?.name,
        form_type: f.form_type || f.attributes?.form_type || 'landing',
        status: f.status || f.attributes?.status,
        created_at: f.created_at || f.attributes?.created_at,
        code: f.code || f.attributes?.code,
      }));
      setForms(formsData);
    } catch (err: any) {
      console.error('Failed to fetch forms:', err);
      setError(err?.message || 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (formId: string, formName: string) => {
    if (!formsBlock?.landings) return;
    setLoadingLeads(true);
    setSelectedForm(formId);
    setSelectedFormName(formName);
    setExpandedLead(null);
    try {
      const response = await (formsBlock.landings as any).list({ form_id: formId });
      const rawLeads = (response?.data || []).map((l: any) => ({
        id: l.id,
        data: l.data || l.attributes?.data || {},
        created_at: l.created_at || l.attributes?.created_at,
      }));
      setLeads(rawLeads.map(extractLeadInfo));
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const createForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !formsBlock?.forms) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      // Generate a code from the name (lowercase, replace spaces with underscores)
      const code = createFormData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      await formsBlock.forms.create({
        ...createFormData,
        code,
      } as any);
      setCreateSuccess(true);
      setCreateFormData({ name: '', form_type: 'landing', description: '', status: 'active' });
      await fetchForms();
      setTimeout(() => {
        setView('leads');
        setCreateSuccess(false);
      }, 1500);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create form');
    } finally {
      setCreating(false);
    }
  };

  // Filter leads by date
  const filterConfig = DATE_FILTERS.find(f => f.key === dateFilter);
  const filterStart = filterConfig?.getStart();
  const filteredLeads = filterStart
    ? leads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= filterStart)
    : leads;

  const getCounts = () => DATE_FILTERS.map(f => {
    const start = f.getStart();
    const count = start
      ? leads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= start).length
      : leads.length;
    return { ...f, count };
  });

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>Error</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setError(null); setLoading(true); loadInitialData(); }}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: 'white', background: '#667eea', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >Try Again</button>
            <button
              onClick={() => signOut()}
              style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >Logout</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: 0 }}>23blocks Forms</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>{user?.email || user?.name}</span>
            <button onClick={() => signOut()} style={{ padding: '8px 16px', fontSize: '14px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        {/* Navigation tabs */}
        <div style={{ display: 'flex', gap: '8px', paddingBottom: '0' }}>
          <button
            onClick={() => setView('leads')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: view === 'leads' ? '#667eea' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: view === 'leads' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >📬 Website Leads</button>
          <button
            onClick={() => setView('create')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: view === 'create' ? '#667eea' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: view === 'create' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >✨ Create Form</button>
        </div>
      </header>

      {/* Content */}
      {view === 'create' ? (
        <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>Create New Form</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>Set up a new form to collect data from your website</p>
            {createSuccess && (
              <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✓</span> Form created successfully!
              </div>
            )}
            {createError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{createError}</div>
            )}
            <form onSubmit={createForm}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Form Name *</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g., Contact Form, Newsletter Signup"
                  required
                  disabled={creating}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Form Type</label>
                <select
                  value={createFormData.form_type}
                  onChange={e => setCreateFormData({ ...createFormData, form_type: e.target.value })}
                  disabled={creating}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', background: 'white' }}
                >
                  <option value="landing">📬 Landing Form - Collect leads from website</option>
                  <option value="survey">📊 Survey - Gather feedback and opinions</option>
                  <option value="appointment">📅 Appointment - Schedule bookings</option>
                  <option value="app_form">📋 App Form - Internal application forms</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={e => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Brief description of what this form is for..."
                  disabled={creating}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Status</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="status" value="active" checked={createFormData.status === 'active'} onChange={e => setCreateFormData({ ...createFormData, status: e.target.value })} disabled={creating} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      Active
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="status" value="draft" checked={createFormData.status === 'draft'} onChange={e => setCreateFormData({ ...createFormData, status: e.target.value })} disabled={creating} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                      Draft
                    </span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={creating || !createFormData.name.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'white',
                  background: creating ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >{creating ? 'Creating...' : 'Create Form'}</button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', height: 'calc(100vh - 113px)' }}>
          {/* Forms List */}
          <div style={{ width: '300px', background: 'white', borderRight: '1px solid #e5e7eb', overflow: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Forms</div>
            {forms.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                <p>No forms yet</p>
              </div>
            ) : (
              forms.map(form => (
                <div
                  key={form.id}
                  onClick={() => fetchLeads(form.id, form.name)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedForm === form.id ? '#eef2ff' : 'white',
                    borderLeft: selectedForm === form.id ? '3px solid #667eea' : '3px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#1f2937', fontSize: '14px' }}>{form.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{form.form_type || 'landing'}</div>
                </div>
              ))
            )}
          </div>
          {/* Leads Panel */}
          <div style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
            {!selectedForm ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📬</div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Select a form</h2>
                <p>Choose a form from the list to view leads</p>
              </div>
            ) : loadingLeads ? (
              <div style={{ textAlign: 'center', padding: '80px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280' }}>Loading leads...</p>
              </div>
            ) : (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>{selectedFormName}</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {getCounts().map(f => (
                      <button
                        key={f.key}
                        onClick={() => setDateFilter(f.key)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          background: dateFilter === f.key ? '#667eea' : 'white',
                          color: dateFilter === f.key ? 'white' : '#4b5563',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >{f.label} ({f.count})</button>
                    ))}
                  </div>
                </div>
                {filteredLeads.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: '12px', padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px' }}>No leads {dateFilter !== 'all' ? 'for this period' : 'yet'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredLeads.map((lead, i) => (
                      <div key={lead.id || i} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                          style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
                        >
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '16px', flexShrink: 0 }}>
                            {(lead.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '15px' }}>{lead.name}</div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {lead.email && <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>✉️ {lead.email}</span>}
                              {lead.phone && <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>📱 {lead.phone}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>{expandedLead === lead.id ? '▼' : '▶'}</div>
                        </div>
                        {expandedLead === lead.id && (
                          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f3f4f6' }}>
                            {lead.company && (
                              <div style={{ marginTop: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Company</span>
                                <p style={{ marginTop: '4px', color: '#1f2937' }}>{lead.company}</p>
                              </div>
                            )}
                            {lead.message && (
                              <div style={{ marginTop: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Message</span>
                                <p style={{ marginTop: '4px', color: '#1f2937', whiteSpace: 'pre-wrap' }}>{lead.message}</p>
                              </div>
                            )}
                            <div style={{ marginTop: '16px' }}>
                              <details>
                                <summary style={{ fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>View raw data</summary>
                                <pre style={{ marginTop: '8px', fontSize: '11px', background: '#f9fafb', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' }}>
                                  {JSON.stringify(lead.rawData, null, 2)}
                                </pre>
                              </details>
                            </div>
                          </div>
                        )}
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
