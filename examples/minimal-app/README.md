# Minimal MCP App Example

A simple example showing how to create an MCP App with interactive UI.

## Structure

```
minimal-app/
├── src/
│   ├── server/
│   │   └── index.ts    # MCP server with tool and UI resource
│   └── ui/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx     # React UI component
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

1. **MCP Server** (`src/server/index.ts`):
   - Registers a `show_dashboard` tool
   - Tool returns `_meta.ui.resourceUri` pointing to `ui://minimal/dashboard`
   - Server handles `ui://minimal/dashboard` resource requests
   - Returns HTML content for the UI

2. **React UI** (`src/ui/`):
   - Interactive React application
   - Communicates with MCP host via `postMessage`
   - Built with Vite for development

## Usage

```bash
# Install dependencies
pnpm install

# Development (runs server with hot reload)
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

## Integration

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "minimal-app": {
      "command": "node",
      "args": ["/path/to/minimal-app/dist/server/index.js"]
    }
  }
}
```

Then ask Claude: "Show me the dashboard"
