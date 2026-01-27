/**
 * HTML Bundle utilities for MCP Apps
 * Creates self-contained HTML bundles for UI rendering
 */

export interface BundleOptions {
  title?: string;
  styles?: string;
  scripts?: string;
  body: string;
}

/**
 * Build a self-contained HTML bundle for MCP App UI
 */
export function buildHtmlBundle(options: BundleOptions): string {
  const { title = '23blocks App', styles = '', scripts = '', body } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.5;
      color: #333;
      background: #f5f5f5;
      padding: 16px;
    }
    ${styles}
  </style>
</head>
<body>
  ${body}
  <script>
    // MCP Apps communication bridge
    window.mcpBridge = {
      send: (message) => window.parent.postMessage({ type: 'mcp-message', payload: message }, '*'),
      onMessage: (callback) => {
        window.addEventListener('message', (e) => {
          if (e.data?.type === 'mcp-message') callback(e.data.payload);
        });
      }
    };
    ${scripts}
  </script>
</body>
</html>`;
}

/**
 * Build HTML bundle from React app bundle
 */
export function buildReactBundle(options: {
  title?: string;
  appBundle: string;
  styles?: string;
}): string {
  const { title = '23blocks App', appBundle, styles = '' } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #333;
      background: #f5f5f5;
    }
    #root { min-height: 100vh; }
    ${styles}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${appBundle}
  </script>
</body>
</html>`;
}
