# Creating MCP Apps

This guide explains how to create a new MCP App for 23blocks.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Understanding of MCP (Model Context Protocol)
- Understanding of React

## Architecture

An MCP App consists of two parts:

1. **MCP Server** - Node.js server that registers tools and serves UI resources
2. **UI Application** - React app that renders in the client's iframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude Desktop / MCP Client                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Chat Interface                                           │  │
│  │  User: "Show me the forms dashboard"                      │  │
│  │  Claude: "Opening Forms Dashboard..."                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                                                     │  │  │
│  │  │     Interactive UI (iframe)                         │  │  │
│  │  │     - Rendered from ui://forms/dashboard            │  │  │
│  │  │     - Can call back to MCP server                   │  │  │
│  │  │                                                     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Creating a New App

### 1. Copy the template

```bash
cp -r examples/minimal-app apps/YOUR-BLOCK-app
cd apps/YOUR-BLOCK-app
```

### 2. Update package.json

```json
{
  "name": "@23blocks/YOUR-BLOCK-app",
  "version": "0.1.0"
}
```

### 3. Create your MCP server

Edit `src/server/index.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnvVars } from "@23blocks/mcp-utils";

const env = validateEnvVars();

const server = new McpServer({
  name: "23blocks-YOUR-BLOCK-app",
  version: "0.1.0"
});

// Register a tool with UI
server.tool(
  "your_tool_name",
  "Description of what this tool does",
  {
    type: "object",
    properties: {
      param1: { type: "string", description: "Parameter description" }
    }
  },
  async (args) => {
    return {
      content: [{ type: "text", text: "Opening UI..." }],
      _meta: {
        ui: { resourceUri: "ui://your-block/dashboard" }
      }
    };
  }
);

// Register UI resource
server.resource(
  "ui://your-block/dashboard",
  "Dashboard description",
  async () => ({
    contents: [{
      uri: "ui://your-block/dashboard",
      mimeType: "text/html",
      text: "<html>...</html>"
    }]
  })
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### 4. Build the UI

For simple UIs, you can return HTML directly from the resource handler.

For complex UIs, build a React app in `src/ui/`:

```typescript
// src/ui/App.tsx
import React from 'react';
import { useMcpContext } from '@23blocks/shared-ui';

export default function App() {
  const { sendMessage, onMessage } = useMcpContext();

  const handleAction = () => {
    sendMessage({ action: 'do-something' });
  };

  return (
    <div>
      <h1>Your Dashboard</h1>
      <button onClick={handleAction}>Do Something</button>
    </div>
  );
}
```

### 5. Build and test

```bash
# Development mode
pnpm dev

# Build for production
pnpm build
```

## Communication

### UI to Server

```typescript
// In React component
window.parent.postMessage({
  type: 'mcp-message',
  payload: { action: 'refresh-data' }
}, '*');
```

### Server to UI

The server can send data via the resource response or through the MCP protocol's notification system.

## Environment Variables

Always use the standard 23blocks environment variables:

```bash
BLOCKS_API_URL          # API base URL
BLOCKS_API_KEY          # AppId header value
BLOCKS_AUTH_TOKEN       # Bearer token
```

Use `validateEnvVars()` from `@23blocks/mcp-utils` to validate.

## Best Practices

1. **Pre-flight check** - Validate environment variables before starting
2. **Error handling** - Return user-friendly error messages
3. **Loading states** - Show loading indicators in UI
4. **Responsive design** - UI renders in constrained iframe
5. **Security** - Never expose credentials in HTML/JS
