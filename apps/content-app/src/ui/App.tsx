import React, { useState, useEffect } from 'react';
import { useMcpContext, Loading, Card } from '@23blocks/shared-ui';

interface Post {
  id: string;
  title: string;
  status: string;
  views: number;
  comments: number;
  published_at?: string;
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendMessage, onMessage } = useMcpContext();

  useEffect(() => {
    setTimeout(() => {
      setPosts([
        { id: '1', title: 'Getting Started with MCP Apps', status: 'published', views: 1234, comments: 23, published_at: '2 hours ago' },
        { id: '2', title: 'Building Interactive AI Interfaces', status: 'published', views: 892, comments: 15, published_at: 'yesterday' },
        { id: '3', title: 'Advanced Content Management Patterns', status: 'draft', views: 0, comments: 0 },
      ]);
      setLoading(false);
    }, 500);

    const unsubscribe = onMessage((msg: any) => {
      if (msg.action === 'navigate') {
        // Handle navigation
      }
    });

    return unsubscribe;
  }, [onMessage]);

  if (loading) {
    return <Loading message="Loading content..." />;
  }

  return (
    <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: '#1a1a2e', margin: 0 }}>Content Dashboard</h1>
        <button
          onClick={() => sendMessage({ action: 'new-post' })}
          style={{
            padding: '10px 20px',
            background: '#4361ee',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          + New Post
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { value: '156', label: 'Total Posts' },
          { value: '12', label: 'Series' },
          { value: '847', label: 'Comments' },
          { value: '23.4K', label: 'Total Views' },
        ].map((stat, i) => (
          <Card key={i}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e' }}>{stat.value}</div>
            <div style={{ color: '#6c757d', fontSize: '14px', marginTop: '4px' }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card title="Recent Posts">
        {posts.map(post => (
          <div
            key={post.id}
            onClick={() => sendMessage({ action: 'edit-post', id: post.id })}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #f1f3f4',
              cursor: 'pointer'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: '#1a1a2e' }}>{post.title}</div>
              <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px' }}>
                {post.status === 'published'
                  ? `Published ${post.published_at} · ${post.views} views · ${post.comments} comments`
                  : 'Draft'}
              </div>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              background: post.status === 'published' ? '#d4edda' : '#fff3cd',
              color: post.status === 'published' ? '#155724' : '#856404'
            }}>
              {post.status}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
