import React, { useState, useEffect } from 'react';
import { useMcpContext, useApi, Card, Loading } from '@23blocks/shared-ui';

type View = 'dashboard' | 'survey-builder' | 'submissions' | 'analytics';

interface Form {
  id: string;
  name: string;
  form_type: string;
  status: string;
  response_count: number;
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { context, sendMessage, onMessage } = useMcpContext();

  useEffect(() => {
    // Simulate loading forms
    setTimeout(() => {
      setForms([
        { id: '1', name: 'Customer Feedback', form_type: 'survey', status: 'active', response_count: 342 },
        { id: '2', name: 'Contact Form', form_type: 'landing', status: 'active', response_count: 89 },
        { id: '3', name: 'Employee Onboarding', form_type: 'app_form', status: 'draft', response_count: 0 },
      ]);
      setLoading(false);
    }, 500);

    // Listen for navigation messages
    const unsubscribe = onMessage((msg: any) => {
      if (msg.action === 'navigate') {
        setView(msg.target);
      }
    });

    return unsubscribe;
  }, [onMessage]);

  if (loading) {
    return <Loading message="Loading forms..." />;
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{
        background: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '24px', color: '#333', margin: 0 }}>
          Forms Dashboard
        </h1>
        <p style={{ color: '#666', marginTop: '4px' }}>
          Manage your forms, surveys, and appointments
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {forms.map(form => (
          <Card key={form.id} title={form.name}>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              background: form.status === 'active' ? '#d4edda' : '#fff3cd',
              color: form.status === 'active' ? '#155724' : '#856404',
              marginBottom: '8px'
            }}>
              {form.status}
            </span>
            <p style={{ color: '#666', fontSize: '14px' }}>{form.form_type}</p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #eee'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#0066cc' }}>
                  {form.response_count}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>Responses</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
