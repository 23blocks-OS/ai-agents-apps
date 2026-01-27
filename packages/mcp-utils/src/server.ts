/**
 * MCP App Server utilities
 * Helpers for creating MCP servers with UI capabilities
 */

export interface McpAppServerConfig {
  name: string;
  version: string;
  description?: string;
}

export interface ToolWithUi {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    ui?: { resourceUri: string };
  }>;
}

/**
 * Create an MCP App server with UI support
 * This is a wrapper that simplifies the MCP SDK setup
 */
export function createMcpAppServer(config: McpAppServerConfig) {
  const tools: Map<string, ToolWithUi> = new Map();
  const resources: Map<string, () => Promise<string>> = new Map();

  return {
    /**
     * Register a tool that can return a UI
     */
    tool(
      name: string,
      description: string,
      inputSchema: Record<string, unknown>,
      handler: ToolWithUi['handler']
    ) {
      tools.set(name, { name, description, inputSchema, handler });
    },

    /**
     * Register a UI resource
     */
    resource(uri: string, handler: () => Promise<string>) {
      resources.set(uri, handler);
    },

    /**
     * Get server configuration for MCP SDK
     */
    getConfig() {
      return {
        name: config.name,
        version: config.version,
        tools: Array.from(tools.values()),
        resources: Array.from(resources.entries()).map(([uri, handler]) => ({
          uri,
          handler
        }))
      };
    }
  };
}
