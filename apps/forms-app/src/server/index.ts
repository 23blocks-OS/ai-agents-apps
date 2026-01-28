/**
 * 23blocks Forms App - MCP Server
 *
 * An MCP App with interactive UI for Forms Block.
 */

import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

// Get environment variables
const API_URL = process.env.BLOCKS_API_URL || '';
const AUTH_URL = process.env.BLOCKS_AUTH_URL || '';
const API_KEY = process.env.BLOCKS_API_KEY || '';

if (!API_URL || !API_KEY || !AUTH_URL) {
  console.error("ERROR: Missing BLOCKS_API_URL, BLOCKS_AUTH_URL, or BLOCKS_API_KEY environment variables");
  process.exit(1);
}

// Extract origins from URLs for CSP connect-src
function getOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

const API_ORIGIN = getOrigin(API_URL);
const AUTH_ORIGIN = getOrigin(AUTH_URL);
const CSP_CONNECT_DOMAINS = [...new Set([API_ORIGIN, AUTH_ORIGIN])];

// Path to the built UI HTML file
// Works both from source (server/index.ts) and compiled (dist/server/index.js)
const DIST_DIR = import.meta.filename?.endsWith(".ts")
  ? path.join(import.meta.dirname, "../../dist/ui")
  : path.join(import.meta.dirname, "../ui");

// Resource URI for the forms dashboard UI
const DASHBOARD_URI = "ui://forms/dashboard.html";

// Config to send to the UI via tool result
const configJson = JSON.stringify({
  apiUrl: API_URL,
  authUrl: AUTH_URL,
  apiKey: API_KEY,
});

// CRITICAL: This message tells Claude to STOP and wait for user interaction
// Without this, Claude sees JSON config and thinks it needs to take action
const UI_DISPLAYED_MESSAGE = `✅ The Forms Dashboard UI is now displayed directly in this chat window.

IMPORTANT: The user will interact with the UI embedded above - NOT a browser.
- Do NOT use browser automation tools
- Do NOT navigate to any websites
- Do NOT call any other tools
- Simply wait for the user to interact with the UI and respond to you

The UI shows a login form. Once the user logs in, they can view and manage their forms directly in this embedded interface.`;

/**
 * Creates the MCP server with tools and resources.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "23blocks-forms-app",
    version: "0.1.0",
  });

  // Register the main forms_dashboard tool with UI metadata
  registerAppTool(
    server,
    "forms_dashboard",
    {
      title: "Forms Dashboard",
      description: "Open the 23blocks forms management dashboard. If the user already logged in via auth_login, pass the token parameter to skip login.",
      inputSchema: {
        type: "object",
        properties: {
          token: { type: "string", description: "Auth token from auth_login (optional - pass if user already authenticated)" },
        },
      } as unknown as Record<string, never>,
      _meta: { ui: { resourceUri: DASHBOARD_URI } },
    },
    async (args: { token?: string }): Promise<CallToolResult> => {
      // Include token in config if provided
      const config = {
        apiUrl: API_URL,
        authUrl: AUTH_URL,
        apiKey: API_KEY,
        ...(args.token && { token: args.token }),
      };

      const message = args.token
        ? `✅ The Forms Dashboard UI is now displayed with pre-authenticated session.\n\nThe user should see their forms immediately without needing to login again.`
        : UI_DISPLAYED_MESSAGE;

      return {
        content: [
          { type: "text", text: message },
          { type: "text", text: JSON.stringify(config) },
        ],
      };
    },
  );

  // Register the create_form tool
  registerAppTool(
    server,
    "create_form",
    {
      title: "Create Form",
      description: "Open the form creator to create a new form.",
      inputSchema: {},
      _meta: { ui: { resourceUri: `${DASHBOARD_URI}?view=create` } },
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

  // Register the view_leads tool with form_id parameter
  registerAppTool(
    server,
    "view_leads",
    {
      title: "View Leads",
      description: "View leads for a specific form.",
      inputSchema: {
        type: "object",
        properties: {
          form_id: { type: "string", description: "Form ID to view leads for" },
        },
        required: ["form_id"],
      } as unknown as Record<string, never>,
      _meta: { ui: { resourceUri: DASHBOARD_URI } },
    },
    async (args: { form_id?: string }): Promise<CallToolResult> => {
      // Include form_id in the config
      const extendedConfig = JSON.stringify({
        apiUrl: API_URL,
        authUrl: AUTH_URL,
        apiKey: API_KEY,
        formId: args.form_id,
      });
      return {
        content: [
          { type: "text", text: UI_DISPLAYED_MESSAGE },
          { type: "text", text: extendedConfig },
        ],
      };
    },
  );

  // Register the UI resource - serves the built HTML file
  // Include CSP configuration to allow fetch to 23blocks APIs
  registerAppResource(
    server,
    DASHBOARD_URI,
    DASHBOARD_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      try {
        const htmlPath = path.join(DIST_DIR, "index.html");
        const html = await fs.readFile(htmlPath, "utf-8");
        return {
          contents: [{
            uri: DASHBOARD_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  // Allow fetch/XHR to 23blocks APIs
                  connectDomains: CSP_CONNECT_DOMAINS,
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
  console.error("23blocks Forms App MCP server running on stdio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
