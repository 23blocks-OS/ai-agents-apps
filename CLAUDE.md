# 23blocks MCP Apps - Claude Code Context

## Overview

MCP Apps for 23blocks API blocks. Each block (Forms, Content, Files, Jarvis) gets its own app that provides interactive UIs for AI chatbots.

## Repository Location

**SINGLE SOURCE OF TRUTH:**
```
/Users/juanpelaez/23blocks/webApps/ai-agents-apps
```

**GitHub:** `https://github.com/23blocks-OS/ai-agents-apps`

## What are MCP Apps?

MCP Apps is an extension to MCP that allows tools to return rich, interactive UIs. Key concepts:

1. **Server registers tool with UI metadata**: `_meta.ui.resourceUri: "ui://forms/dashboard"`
2. **Server serves UI via `ui://` scheme**: Returns HTML/JS/CSS bundle
3. **Client renders UI in iframe**: Sandboxed, secure execution
4. **Two-way communication**: UI can call back to server

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  23blocks-OS/ai-agents-apps (PUBLIC)                            │
│  /Users/juanpelaez/23blocks/webApps/ai-agents-apps              │
│                                                                 │
│  apps/                                                          │
│  ├── forms-app/     (Forms Block UI)                            │
│  ├── content-app/   (Content Block UI)                          │
│  ├── files-app/     (Files Block UI)                            │
│  └── jarvis-app/    (Jarvis Block UI)                           │
│                                                                 │
│  packages/                                                      │
│  ├── shared-ui/     (Common components)                         │
│  ├── api-client/    (23blocks API wrapper)                      │
│  └── mcp-utils/     (MCP Apps utilities)                        │
└─────────────────────────────────────────────────────────────────┘
```

## App Structure

Each app follows this structure:
```
apps/BLOCK-app/
├── package.json
├── tsconfig.json
├── src/
│   ├── server/           # MCP server
│   │   ├── index.ts      # Server entry
│   │   ├── tools/        # Tool definitions
│   │   └── resources/    # UI resource handlers
│   └── ui/               # React UI
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       └── components/
└── vite.config.ts
```

## Environment Variables

All API calls MUST use standardized env vars:
```bash
BLOCKS_API_KEY          # API key (AppId header)
BLOCKS_AUTH_TOKEN       # Bearer token
BLOCKS_API_URL          # API base URL
```

## Key Technologies

- **MCP Apps SDK**: `@modelcontextprotocol/ext-apps`
- **React 18**: UI framework
- **Vite**: Build tool
- **TypeScript**: Type safety
- **pnpm**: Package manager (workspaces)

## Related Repos

| Repo | Purpose |
|------|---------|
| `23blocks/ai-agents-mono` | Claude Code plugins (skills/agents) |
| `23blocks-OS/ai-agents` | Public plugin distribution |
| `23blocks-OS/ai-agents-apps` | MCP Apps (this repo) |

## Quick Commands

```bash
# Go to repo
cd /Users/juanpelaez/23blocks/webApps/ai-agents-apps

# Install deps
pnpm install

# Dev all apps
pnpm dev

# Build all apps
pnpm build

# Build specific app
pnpm --filter forms-app build
```

## Creating New App

1. Copy `examples/minimal-app` to `apps/BLOCK-app`
2. Update `package.json` name
3. Implement tools in `src/server/tools/`
4. Build UI in `src/ui/`
5. Register in root workspace

## MCP Apps SDK Quick Reference

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcpAppsHandlers } from "@modelcontextprotocol/ext-apps";

const server = new McpServer({ name: "forms-app", version: "1.0.0" });

// Register UI handlers
registerMcpAppsHandlers(server);

// Tool with UI
server.tool(
  "forms_dashboard",
  "Open forms management dashboard",
  {},
  async () => ({
    content: [{ type: "text", text: "Dashboard loaded" }],
    _meta: {
      ui: { resourceUri: "ui://forms/dashboard" }
    }
  })
);

// Serve UI resource
server.resource("ui://forms/dashboard", async () => ({
  contents: [{
    uri: "ui://forms/dashboard",
    mimeType: "text/html",
    text: "<html>...</html>"
  }]
}));
```
