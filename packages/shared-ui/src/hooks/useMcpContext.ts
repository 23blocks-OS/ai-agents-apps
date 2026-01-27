import { useState, useEffect, useCallback } from 'react';

interface McpContext {
  sessionId?: string;
  conversationId?: string;
  toolCallId?: string;
}

interface UseMcpContextResult {
  context: McpContext;
  sendMessage: (message: unknown) => void;
  onMessage: (callback: (message: unknown) => void) => () => void;
}

/**
 * Hook for interacting with MCP Apps context
 * Provides communication bridge between UI and MCP server
 */
export function useMcpContext(): UseMcpContextResult {
  const [context, setContext] = useState<McpContext>({});

  useEffect(() => {
    // Listen for context updates from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mcp-context') {
        setContext(event.data.context || {});
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial context
    window.parent.postMessage({ type: 'mcp-context-request' }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    window.parent.postMessage({
      type: 'mcp-message',
      payload: message
    }, '*');
  }, []);

  const onMessage = useCallback((callback: (message: unknown) => void) => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'mcp-message') {
        callback(event.data.payload);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return { context, sendMessage, onMessage };
}
