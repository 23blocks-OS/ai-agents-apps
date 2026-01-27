/**
 * Minimal MCP App Server Example
 *
 * This demonstrates how to create an MCP server that serves interactive UIs.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create MCP server
const server = new McpServer({
  name: "minimal-app",
  version: "0.1.0"
});

// Register a tool that returns UI
server.tool(
  "show_dashboard",
  "Display an interactive dashboard",
  {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Dashboard title"
      }
    }
  },
  async (args) => {
    const title = (args as { title?: string }).title || "Dashboard";

    return {
      content: [
        {
          type: "text",
          text: `Opening ${title} dashboard...`
        }
      ],
      _meta: {
        ui: {
          resourceUri: "ui://minimal/dashboard"
        }
      }
    };
  }
);

// Serve UI resource
server.resource(
  "ui://minimal/dashboard",
  "Interactive dashboard UI",
  async () => {
    // In production, this would load the built React app
    // For now, return a simple HTML page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minimal Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #333; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 24px; }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    .counter { font-size: 48px; text-align: center; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Minimal MCP App</h1>
    <p>This is an interactive UI served by an MCP server.</p>
    <div class="counter" id="count">0</div>
    <button onclick="increment()">Click Me!</button>
  </div>
  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('count').textContent = count;
      // Send message back to MCP server
      window.parent.postMessage({ type: 'mcp-message', payload: { action: 'increment', count } }, '*');
    }
  </script>
</body>
</html>`;

    return {
      contents: [
        {
          uri: "ui://minimal/dashboard",
          mimeType: "text/html",
          text: html
        }
      ]
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Minimal MCP App server running on stdio");
}

main().catch(console.error);
