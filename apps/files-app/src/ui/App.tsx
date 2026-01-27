import React, { useState, useEffect } from 'react';
import { useMcpContext, Loading, Card } from '@23blocks/shared-ui';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
}

const categoryIcons: Record<string, string> = {
  images: '🖼️',
  documents: '📄',
  videos: '🎬',
  audio: '🎵',
  other: '📁'
};

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendMessage, onMessage } = useMcpContext();

  useEffect(() => {
    setTimeout(() => {
      setFiles([
        { id: '1', name: 'screenshot.png', type: 'image/png', size: '2.4 MB', category: 'images' },
        { id: '2', name: 'report.pdf', type: 'application/pdf', size: '1.2 MB', category: 'documents' },
        { id: '3', name: 'data.xlsx', type: 'application/xlsx', size: '856 KB', category: 'documents' },
        { id: '4', name: 'demo.mp4', type: 'video/mp4', size: '45.2 MB', category: 'videos' },
        { id: '5', name: 'banner.jpg', type: 'image/jpeg', size: '890 KB', category: 'images' },
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
    return <Loading message="Loading files..." />;
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: '#1a1a2e', margin: 0 }}>Files Dashboard</h1>
        <button
          onClick={() => sendMessage({ action: 'upload' })}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          + Upload Files
        </button>
      </div>

      <Card>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginBottom: '12px' }}>Storage Usage</h3>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '8px',
            height: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              background: 'white',
              height: '100%',
              width: '67%',
              borderRadius: '8px'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>6.7 GB of 10 GB used</span>
            <span>3.3 GB available</span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {Object.entries({ images: 1234, documents: 567, videos: 89, other: 234 }).map(([cat, count]) => (
          <Card key={cat}>
            <div
              onClick={() => sendMessage({ action: 'browse', category: cat })}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{categoryIcons[cat]}</div>
              <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{cat}</div>
              <div style={{ fontSize: '13px', color: '#6c757d' }}>{count} files</div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Recent Files">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => sendMessage({ action: 'view-file', id: file.id })}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>{categoryIcons[file.category]}</div>
              <div style={{ fontSize: '13px', color: '#1a1a2e', wordBreak: 'break-word' }}>{file.name}</div>
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>{file.size}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
