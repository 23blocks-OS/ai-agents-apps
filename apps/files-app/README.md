# 23blocks Files App

MCP App for the 23blocks Files Block. Provides interactive UIs for managing files, storage, and access control.

## Features

- **Files Dashboard** - Overview with storage usage and categories
- **File Browser** - Browse and search files by folder or category
- **Upload Manager** - Upload files with progress tracking
- **Access Control** - Manage file permissions and sharing
- **Storage Analytics** - Storage usage insights

## Tools

| Tool | Description |
|------|-------------|
| `files_dashboard` | Open the files management dashboard |
| `file_browser` | Browse files in a folder or category |
| `upload_manager` | Open the upload manager |
| `file_access_control` | Manage file access permissions |
| `storage_analytics` | View storage usage analytics |

## Setup

```bash
# From repo root
pnpm install

# Set environment variables
export BLOCKS_API_URL="https://api.23blocks.com"
export BLOCKS_API_KEY="your-app-id"
export BLOCKS_AUTH_TOKEN="your-bearer-token"

# Development
pnpm --filter @23blocks/files-app dev

# Build
pnpm --filter @23blocks/files-app build
```

## Claude Desktop Integration

Add to `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "23blocks-files": {
      "command": "node",
      "args": ["/path/to/files-app/dist/server/index.js"],
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
- "Show me the files dashboard"
- "Browse my images"
- "Open the upload manager"
- "Show storage analytics"
- "Manage access for file xyz"
