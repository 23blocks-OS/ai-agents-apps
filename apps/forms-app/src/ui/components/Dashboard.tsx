import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Loading } from '@23blocks/shared-ui';

interface Form {
  id: string;
  name: string;
  form_type: string;
  status: string;
  created_at: string;
  submissions_count?: number;
}

const API_URL = (window as any).__BLOCKS_API_URL__ || '';
const API_KEY = (window as any).__BLOCKS_API_KEY__ || '';

export function Dashboard() {
  const { token, user, logout } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, [token]);

  const fetchForms = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/forms`, {
        headers: {
          'AppId': API_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      setForms(data.data || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading forms..." />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
            Forms Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {user?.email}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#6b7280',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <Card>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>
              {forms.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Forms</div>
          </Card>
          <Card>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
              {forms.filter(f => f.status === 'active').length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Active Forms</div>
          </Card>
          <Card>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
              {forms.filter(f => f.status === 'draft').length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Drafts</div>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Forms List */}
        <Card title="Your Forms">
          {forms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p>No forms yet. Create your first form!</p>
            </div>
          ) : (
            <div>
              {forms.map(form => (
                <div
                  key={form.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: '#1f2937' }}>
                      {form.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                      {form.form_type} · Created {new Date(form.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: form.status === 'active' ? '#d1fae5' : '#fef3c7',
                    color: form.status === 'active' ? '#065f46' : '#92400e',
                  }}>
                    {form.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
