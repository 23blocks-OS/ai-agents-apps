/**
 * 23blocks Auth App - MCP Server
 *
 * An MCP App that handles authentication and attempts to share
 * the token with other MCP Apps via various methods.
 */

import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

// Get environment variables
const AUTH_URL = process.env.BLOCKS_AUTH_URL || '';
const API_KEY = process.env.BLOCKS_API_KEY || '';

if (!API_KEY || !AUTH_URL) {
  console.error("ERROR: Missing BLOCKS_AUTH_URL or BLOCKS_API_KEY environment variables");
  process.exit(1);
}

// Extract origin from URL for CSP
function getOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

const AUTH_ORIGIN = getOrigin(AUTH_URL);

// Path to the built UI HTML file
const DIST_DIR = import.meta.filename?.endsWith(".ts")
  ? path.join(import.meta.dirname, "../../dist/ui")
  : path.join(import.meta.dirname, "../ui");

// Resource URI for the auth UI
const AUTH_URI = "ui://auth/login.html";

// Config to send to the UI via tool result
const configJson = JSON.stringify({
  authUrl: AUTH_URL,
  apiKey: API_KEY,
});

// Message for Claude when UI is displayed
const UI_DISPLAYED_MESSAGE = `✅ The 23blocks Authentication UI is now displayed.

This is a shared authentication app. Once the user logs in:
1. The token will be stored and shared with other 23blocks MCP Apps
2. You can then open other apps (forms_dashboard, content_dashboard, etc.) without requiring login again

Wait for the user to complete login. They will see a success message when done.`;

/**
 * Creates the MCP server with tools and resources.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "23blocks-auth-app",
    version: "0.1.0",
  });

  // Register the login tool with UI metadata
  registerAppTool(
    server,
    "auth_login",
    {
      title: "23blocks Login",
      description: "Open the 23blocks authentication UI. Login once to access all 23blocks apps (Forms, Content, Files, etc.)",
      inputSchema: {},
      _meta: { ui: { resourceUri: AUTH_URI } },
    },
    async (): Promise<CallToolResult> => {
      return {
        content: [
          { type: "text", text: UI_DISPLAYED_MESSAGE },
          { type: "text", text: configJson },
        ],
      };
    },
  );

  // Register the UI resource
  registerAppResource(
    server,
    AUTH_URI,
    AUTH_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      try {
        const htmlPath = path.join(DIST_DIR, "index.html");
        const html = await fs.readFile(htmlPath, "utf-8");
        return {
          contents: [{
            uri: AUTH_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  connectDomains: [AUTH_ORIGIN],
                },
              },
            },
          }],
        };
      } catch (err) {
        console.error("Error reading UI file:", err);
        throw err;
      }
    },
  );

  return server;
}

// Start the server
async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error("23blocks Auth App MCP server running on stdio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
