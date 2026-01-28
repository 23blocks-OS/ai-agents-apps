/**
 * MCP App Bridge - Handles communication between UI and MCP host
 */
import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';

// Singleton app instance
let app: App | null = null;
let connected = false;

// Config received from tool result
let config: { apiUrl: string; authUrl: string; apiKey: string } | null = null;

// Listeners for config updates
const configListeners: ((config: { apiUrl: string; authUrl: string; apiKey: string }) => void)[] = [];

export function onConfigReceived(listener: (config: { apiUrl: string; authUrl: string; apiKey: string }) => void) {
  configListeners.push(listener);
  // If config already received, call immediately
  if (config) {
    listener(config);
  }
}

export function getConfig() {
  return config;
}

export async function initMcpApp(): Promise<App> {
  if (app && connected) return app;

  app = new App({ name: "23blocks Forms", version: "0.1.0" });

  // Handle tool results from server - this is how we receive config
  app.ontoolresult = (result: any) => {
    console.log('[MCP] Tool result received:', result);

    // Extract config from tool result content
    // Search through all text content blocks to find the JSON config
    const textContents = result.content?.filter((c: any) => c.type === 'text') || [];
    for (const textContent of textContents) {
      if (textContent?.text) {
        try {
          // Try to parse as JSON config
          const parsed = JSON.parse(textContent.text);
          if (parsed.apiUrl && parsed.authUrl && parsed.apiKey) {
            config = parsed;
            console.log('[MCP] Config received from tool result');
            configListeners.forEach(l => l(config!));
            break; // Found config, stop searching
          }
        } catch {
          // Not JSON config, continue to next block
        }
      }
    }

    // Dispatch custom event for React components
    window.dispatchEvent(new CustomEvent('mcp:toolresult', { detail: result }));
  };

  app.onhostcontextchanged = (ctx: any) => {
    console.log('[MCP] Host context changed:', ctx);
    if (ctx.theme) applyDocumentTheme(ctx.theme);
    if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  };

  app.onerror = (err: any) => console.error('[MCP] Error:', err);

  try {
    await app.connect();
    connected = true;
    console.log('[MCP] Connected to host');

    // Apply initial theme
    const ctx = app.getHostContext();
    if (ctx?.theme) applyDocumentTheme(ctx.theme);
  } catch (err: any) {
    console.log('[MCP] Running standalone:', err.message);
    connected = false;
  }

  return app;
}

export function getMcpApp(): App | null {
  return app;
}

export function isConnected(): boolean {
  return connected;
}

/**
 * Send a message back to the AI
 */
export async function sendMessage(text: string): Promise<void> {
  if (!app || !connected) return;

  try {
    await app.sendMessage({
      role: 'user',
      content: [{ type: 'text', text }]
    });
  } catch (err) {
    console.error('[MCP] Error sending message:', err);
  }
}

/**
 * Call a server tool from the UI
 */
export async function callServerTool(name: string, args: Record<string, any> = {}): Promise<any> {
  if (!app || !connected) {
    console.warn('[MCP] Not connected, cannot call tool:', name);
    return null;
  }

  try {
    return await app.callServerTool({ name, arguments: args });
  } catch (err) {
    console.error('[MCP] Error calling tool:', name, err);
    throw err;
  }
}
