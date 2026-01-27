# 23blocks Forms App

MCP App for the 23blocks Forms Block. Provides interactive UIs for managing forms, surveys, and appointments.

## Features

- **Forms Dashboard** - View and manage all forms
- **Survey Builder** - Visual survey creation tool
- **Submissions Viewer** - Browse and filter form submissions
- **Analytics Dashboard** - Forms performance insights

## Tools

| Tool | Description |
|------|-------------|
| `forms_dashboard` | Open the forms management dashboard |
| `survey_builder` | Open the interactive survey builder |
| `form_submissions` | View submissions for a specific form |
| `forms_analytics` | View analytics and insights |

## Setup

```bash
# From repo root
pnpm install

# Set environment variables
export BLOCKS_API_URL="https://api.23blocks.com"
export BLOCKS_API_KEY="your-app-id"
export BLOCKS_AUTH_TOKEN="your-bearer-token"

# Development
pnpm --filter @23blocks/forms-app dev

# Build
pnpm --filter @23blocks/forms-app build
```

## Claude Desktop Integration

Add to `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "23blocks-forms": {
      "command": "node",
      "args": ["/path/to/forms-app/dist/server/index.js"],
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
- "Show me the forms dashboard"
- "Open the survey builder"
- "View submissions for form abc123"
- "Show forms analytics"
