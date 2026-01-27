import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
    // Send message to parent (MCP host)
    window.parent.postMessage({
      type: 'mcp-message',
      payload: { action: 'increment', count: count + 1 }
    }, '*');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '16px' }}>
          Minimal MCP App
        </h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          This is an interactive React UI served by an MCP server.
        </p>
        <div style={{
          fontSize: '48px',
          textAlign: 'center',
          margin: '24px 0',
          color: '#667eea'
        }}>
          {count}
        </div>
        <button
          onClick={handleClick}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Click Me!
        </button>
      </div>
    </div>
  );
}
