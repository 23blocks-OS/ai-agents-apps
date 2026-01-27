# 23blocks MCP Apps

Interactive UI applications for AI chatbots using MCP Apps SDK.

## What are MCP Apps?

MCP Apps is an extension to the Model Context Protocol that allows MCP servers to return rich, interactive user interfaces alongside tool results. Instead of just text responses, your AI assistant can display:

- Interactive dashboards
- Data visualizations
- Forms and wizards
- Real-time monitors
- And more...

## Available Apps

| App | Description | Status |
|-----|-------------|--------|
| `forms-app` | Forms management dashboard, survey builder, analytics | Planned |
| `content-app` | Content management, post editor, series organizer | Planned |
| `files-app` | File browser, upload manager, access control dashboard | Planned |
| `jarvis-app` | AI agent management, conversation viewer | Planned |

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- 23blocks API credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/23blocks-OS/ai-agents-apps.git
cd ai-agents-apps

# Install dependencies
pnpm install

# Set environment variables
export BLOCKS_API_URL="https://api.23blocks.com"
export BLOCKS_API_KEY="your-app-id"
export BLOCKS_AUTH_TOKEN="your-bearer-token"

# Run development server
pnpm dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BLOCKS_API_URL` | 23blocks API base URL |
| `BLOCKS_API_KEY` | Your application ID (AppId header) |
| `BLOCKS_AUTH_TOKEN` | Bearer token for authentication |

## Project Structure

```
ai-agents-apps/
├── apps/                    # MCP App applications
│   ├── forms-app/          # Forms Block dashboard
│   ├── content-app/        # Content Block dashboard
│   ├── files-app/          # Files Block dashboard
│   └── jarvis-app/         # Jarvis Block dashboard
├── packages/               # Shared packages
│   ├── shared-ui/          # Common UI components
│   ├── api-client/         # 23blocks API client
│   └── mcp-utils/          # MCP Apps utilities
├── examples/               # Example apps
│   └── minimal-app/        # Minimal MCP App example
└── docs/                   # Documentation
```

## Creating an MCP App

Each app consists of:

1. **MCP Server** - Registers tools and serves UI resources
2. **UI Application** - React app with interactive components

See [docs/creating-apps.md](docs/creating-apps.md) for detailed guide.

## Contributing

1. Fork the repo
2. Create feature branch (`feat/my-feature`)
3. Make changes
4. Submit PR

## License

MIT - See [LICENSE](LICENSE) for details.

## Related

- [23blocks API Documentation](https://docs.23blocks.com)
- [MCP Apps SDK](https://github.com/modelcontextprotocol/mcp-apps)
- [23blocks Claude Plugins](https://github.com/23blocks-OS/ai-agents)
