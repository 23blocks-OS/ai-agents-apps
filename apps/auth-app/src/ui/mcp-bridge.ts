/**
 * MCP App Bridge - Handles communication between UI and MCP host
 *
 * This version includes experiments for sharing auth state across MCP Apps.
 */
import { App, applyDocumentTheme, applyHostStyleVariables } from '@modelcontextprotocol/ext-apps';

// Singleton app instance
let app: App | null = null;
let connected = false;

// Config received from tool result
let config: { authUrl: string; apiKey: string } | null = null;

// Listeners for config updates
const configListeners: ((config: { authUrl: string; apiKey: string }) => void)[] = [];

export function onConfigReceived(listener: (config: { authUrl: string; apiKey: string }) => void) {
  configListeners.push(listener);
  if (config) {
    listener(config);
  }
}

export function getConfig() {
  return config;
}

export async function initMcpApp(): Promise<App> {
  if (app && connected) return app;

  app = new App({ name: "23blocks Auth", version: "0.1.0" });

  app.ontoolresult = (result: any) => {
    console.log('[MCP] Tool result received:', result);

    const textContents = result.content?.filter((c: any) => c.type === 'text') || [];
    for (const textContent of textContents) {
      if (textContent?.text) {
        try {
          const parsed = JSON.parse(textContent.text);
          if (parsed.authUrl && parsed.apiKey) {
            config = parsed;
            console.log('[MCP] Config received from tool result');
            configListeners.forEach(l => l(config!));
            break;
          }
        } catch {
          // Not JSON config, continue
        }
      }
    }

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
 * Update model context with auth token
 * This makes the token available to the AI for future interactions
 */
export async function updateModelContextWithToken(token: string): Promise<void> {
  if (!app || !connected) return;

  try {
    await app.updateModelContext({
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: '23blocks_auth',
          token: token,
          timestamp: Date.now(),
        })
      }]
    });
    console.log('[MCP] Updated model context with token');
  } catch (err) {
    console.error('[MCP] Error updating model context:', err);
  }
}

/**
 * Storage experiment results
 */
export interface StorageTestResult {
  localStorage: boolean;
  sessionStorage: boolean;
  broadcastChannel: boolean;
  updateModelContext: boolean;
}

/**
 * Test all storage methods and return what works
 */
export async function testStorageMethods(token: string): Promise<StorageTestResult> {
  const results: StorageTestResult = {
    localStorage: false,
    sessionStorage: false,
    broadcastChannel: false,
    updateModelContext: false,
  };

  // Test localStorage
  try {
    localStorage.setItem('23blocks_auth_token', token);
    const retrieved = localStorage.getItem('23blocks_auth_token');
    results.localStorage = retrieved === token;
    console.log('[Storage] localStorage:', results.localStorage ? 'WORKS' : 'FAILED');
  } catch (err) {
    console.log('[Storage] localStorage: BLOCKED', err);
  }

  // Test sessionStorage
  try {
    sessionStorage.setItem('23blocks_auth_token', token);
    const retrieved = sessionStorage.getItem('23blocks_auth_token');
    results.sessionStorage = retrieved === token;
    console.log('[Storage] sessionStorage:', results.sessionStorage ? 'WORKS' : 'FAILED');
  } catch (err) {
    console.log('[Storage] sessionStorage: BLOCKED', err);
  }

  // Test BroadcastChannel
  try {
    const channel = new BroadcastChannel('23blocks_auth');
    channel.postMessage({ type: 'auth_token', token });
    results.broadcastChannel = true; // Can't verify receipt without another listener
    console.log('[Storage] BroadcastChannel: SENT (cannot verify receipt)');
    channel.close();
  } catch (err) {
    console.log('[Storage] BroadcastChannel: BLOCKED', err);
  }

  // Test updateModelContext
  try {
    await updateModelContextWithToken(token);
    results.updateModelContext = true;
    console.log('[Storage] updateModelContext: SENT');
  } catch (err) {
    console.log('[Storage] updateModelContext: FAILED', err);
  }

  return results;
}
