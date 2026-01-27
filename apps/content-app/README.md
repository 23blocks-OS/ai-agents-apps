# 23blocks Content App

MCP App for the 23blocks Content Block. Provides interactive UIs for managing posts, series, and comments.

## Features

- **Content Dashboard** - Overview of all content with stats
- **Post Editor** - Rich text editor for creating/editing posts
- **Series Manager** - Organize posts into series
- **Comments Viewer** - Moderate and manage comments

## Tools

| Tool | Description |
|------|-------------|
| `content_dashboard` | Open the content management dashboard |
| `post_editor` | Open the post editor |
| `series_manager` | Open the series manager |
| `comments_viewer` | View and moderate comments |

## Setup

```bash
# From repo root
pnpm install

# Set environment variables
export BLOCKS_API_URL="https://api.23blocks.com"
export BLOCKS_API_KEY="your-app-id"
export BLOCKS_AUTH_TOKEN="your-bearer-token"

# Development
pnpm --filter @23blocks/content-app dev

# Build
pnpm --filter @23blocks/content-app build
```

## Claude Desktop Integration

Add to `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "23blocks-content": {
      "command": "node",
      "args": ["/path/to/content-app/dist/server/index.js"],
      "env": {
        "BLOCKS_API_URL": "https://api.23blocks.com",
        "BLOCKS_API_KEY": "your-app-id",
        "BLOCKS_AUTH_TOKEN": "your-token"
      }
    }
  }
}
```

## Usage

Ask Claude:
- "Show me the content dashboard"
- "Open the post editor"
- "Create a new post"
- "View comments on my latest post"
- "Show me the series manager"
