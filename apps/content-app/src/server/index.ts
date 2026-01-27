/**
 * 23blocks Content App - MCP Server
 *
 * Provides interactive UIs for Content Block:
 * - Posts Dashboard
 * - Post Editor
 * - Series Manager
 * - Comments Viewer
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnvVars } from "@23blocks/mcp-utils";

// Validate environment
const env = validateEnvVars();

// Create MCP server
const server = new McpServer({
  name: "23blocks-content-app",
  version: "0.1.0"
});

// Tool: Content Dashboard
server.tool(
  "content_dashboard",
  "Open the content management dashboard to view and manage posts, series, and comments",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Content Dashboard..." }],
      _meta: { ui: { resourceUri: "ui://content/dashboard" } }
    };
  }
);

// Tool: Post Editor
server.tool(
  "post_editor",
  "Open the post editor to create or edit content",
  {
    type: "object",
    properties: {
      post_id: {
        type: "string",
        description: "Optional post ID to edit existing post"
      }
    }
  },
  async (args) => {
    const postId = (args as { post_id?: string }).post_id;
    const action = postId ? `Editing post ${postId}` : "Creating new post";

    return {
      content: [{ type: "text", text: `${action}...` }],
      _meta: {
        ui: {
          resourceUri: postId
            ? `ui://content/editor?id=${postId}`
            : "ui://content/editor"
        }
      }
    };
  }
);

// Tool: Series Manager
server.tool(
  "series_manager",
  "Open the series manager to organize posts into series",
  {
    type: "object",
    properties: {
      series_id: {
        type: "string",
        description: "Optional series ID to view specific series"
      }
    }
  },
  async (args) => {
    const seriesId = (args as { series_id?: string }).series_id;

    return {
      content: [{ type: "text", text: "Opening Series Manager..." }],
      _meta: {
        ui: {
          resourceUri: seriesId
            ? `ui://content/series?id=${seriesId}`
            : "ui://content/series"
        }
      }
    };
  }
);

// Tool: Comments Viewer
server.tool(
  "comments_viewer",
  "View and moderate comments on posts",
  {
    type: "object",
    properties: {
      post_id: {
        type: "string",
        description: "Optional post ID to view comments for specific post"
      }
    }
  },
  async (args) => {
    const postId = (args as { post_id?: string }).post_id;

    return {
      content: [{ type: "text", text: "Loading Comments..." }],
      _meta: {
        ui: {
          resourceUri: postId
            ? `ui://content/comments?post_id=${postId}`
            : "ui://content/comments"
        }
      }
    };
  }
);

// UI Resources
server.resource(
  "ui://content/dashboard",
  "Content management dashboard",
  async () => ({
    contents: [{
      uri: "ui://content/dashboard",
      mimeType: "text/html",
      text: getDashboardHtml()
    }]
  })
);

server.resource(
  "ui://content/editor",
  "Post editor",
  async () => ({
    contents: [{
      uri: "ui://content/editor",
      mimeType: "text/html",
      text: getEditorHtml()
    }]
  })
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("23blocks Content App server running on stdio");
}

main().catch(console.error);

// HTML Templates

function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      min-height: 100vh;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h1 { color: #1a1a2e; font-size: 28px; }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-primary { background: #4361ee; color: white; }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .stat-value { font-size: 32px; font-weight: 700; color: #1a1a2e; }
    .stat-label { color: #6c757d; font-size: 14px; margin-top: 4px; }
    .posts-list {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .posts-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e9ecef;
      font-weight: 600;
    }
    .post-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background 0.2s;
    }
    .post-item:hover { background: #f8f9fa; }
    .post-item:last-child { border-bottom: none; }
    .post-info { flex: 1; }
    .post-title { font-weight: 500; color: #1a1a2e; }
    .post-meta { font-size: 13px; color: #6c757d; margin-top: 4px; }
    .post-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-published { background: #d4edda; color: #155724; }
    .status-draft { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Content Dashboard</h1>
    <button class="btn btn-primary" onclick="newPost()">+ New Post</button>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">156</div>
      <div class="stat-label">Total Posts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">12</div>
      <div class="stat-label">Series</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">847</div>
      <div class="stat-label">Comments</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">23.4K</div>
      <div class="stat-label">Total Views</div>
    </div>
  </div>

  <div class="posts-list">
    <div class="posts-header">Recent Posts</div>
    <div class="post-item" onclick="editPost('1')">
      <div class="post-info">
        <div class="post-title">Getting Started with MCP Apps</div>
        <div class="post-meta">Published 2 hours ago · 1,234 views · 23 comments</div>
      </div>
      <span class="post-status status-published">Published</span>
    </div>
    <div class="post-item" onclick="editPost('2')">
      <div class="post-info">
        <div class="post-title">Building Interactive AI Interfaces</div>
        <div class="post-meta">Published yesterday · 892 views · 15 comments</div>
      </div>
      <span class="post-status status-published">Published</span>
    </div>
    <div class="post-item" onclick="editPost('3')">
      <div class="post-info">
        <div class="post-title">Advanced Content Management Patterns</div>
        <div class="post-meta">Draft · Last edited 3 days ago</div>
      </div>
      <span class="post-status status-draft">Draft</span>
    </div>
  </div>

  <script>
    function newPost() {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'editor' }
      }, '*');
    }
    function editPost(id) {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'editor', id }
      }, '*');
    }
  </script>
</body>
</html>`;
}

function getEditorHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Editor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fa;
      min-height: 100vh;
    }
    .toolbar {
      background: white;
      padding: 12px 24px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
    }
    .toolbar-left { flex: 1; display: flex; align-items: center; gap: 12px; }
    .back-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-secondary { background: #e9ecef; color: #495057; }
    .btn-primary { background: #4361ee; color: white; }
    .editor-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .title-input {
      width: 100%;
      font-size: 36px;
      font-weight: 700;
      border: none;
      background: transparent;
      outline: none;
      color: #1a1a2e;
      margin-bottom: 24px;
    }
    .title-input::placeholder { color: #adb5bd; }
    .content-editor {
      width: 100%;
      min-height: 400px;
      font-size: 18px;
      line-height: 1.8;
      border: none;
      background: transparent;
      outline: none;
      resize: none;
      color: #343a40;
    }
    .content-editor::placeholder { color: #adb5bd; }
    .format-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e9ecef;
    }
    .format-btn {
      padding: 8px 12px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .format-btn:hover { background: #e9ecef; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="back-btn" onclick="goBack()">←</button>
      <span style="color: #6c757d; font-size: 14px;">Draft saved</span>
    </div>
    <button class="btn btn-secondary">Preview</button>
    <button class="btn btn-primary">Publish</button>
  </div>

  <div class="editor-container">
    <input type="text" class="title-input" placeholder="Post title..." value="Getting Started with MCP Apps">

    <div class="format-bar">
      <button class="format-btn"><b>B</b></button>
      <button class="format-btn"><i>I</i></button>
      <button class="format-btn"><u>U</u></button>
      <button class="format-btn">H1</button>
      <button class="format-btn">H2</button>
      <button class="format-btn">🔗</button>
      <button class="format-btn">📷</button>
      <button class="format-btn">💻</button>
    </div>

    <textarea class="content-editor" placeholder="Start writing...">MCP Apps is a powerful extension to the Model Context Protocol that enables AI assistants to return rich, interactive user interfaces.

In this guide, we'll explore how to build your first MCP App and integrate it with Claude Desktop.

## Prerequisites

Before getting started, make sure you have:
- Node.js 18 or higher
- pnpm package manager
- Basic understanding of TypeScript and React</textarea>
  </div>

  <script>
    function goBack() {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'dashboard' }
      }, '*');
    }
  </script>
</body>
</html>`;
}
