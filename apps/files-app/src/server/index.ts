/**
 * 23blocks Files App - MCP Server
 *
 * Provides interactive UIs for Files Block:
 * - File Browser
 * - Upload Manager
 * - Access Control Dashboard
 * - Storage Analytics
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnvVars } from "@23blocks/mcp-utils";

// Validate environment
const env = validateEnvVars();

// Create MCP server
const server = new McpServer({
  name: "23blocks-files-app",
  version: "0.1.0"
});

// Tool: Files Dashboard
server.tool(
  "files_dashboard",
  "Open the files management dashboard to browse and manage files",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Files Dashboard..." }],
      _meta: { ui: { resourceUri: "ui://files/dashboard" } }
    };
  }
);

// Tool: File Browser
server.tool(
  "file_browser",
  "Browse files in a specific folder or category",
  {
    type: "object",
    properties: {
      folder_id: {
        type: "string",
        description: "Optional folder ID to browse"
      },
      category: {
        type: "string",
        description: "Optional category filter (images, documents, videos, etc.)"
      }
    }
  },
  async (args) => {
    const { folder_id, category } = args as { folder_id?: string; category?: string };
    let uri = "ui://files/browser";
    const params: string[] = [];
    if (folder_id) params.push(`folder=${folder_id}`);
    if (category) params.push(`category=${category}`);
    if (params.length) uri += `?${params.join('&')}`;

    return {
      content: [{ type: "text", text: "Opening File Browser..." }],
      _meta: { ui: { resourceUri: uri } }
    };
  }
);

// Tool: Upload Manager
server.tool(
  "upload_manager",
  "Open the upload manager to upload new files or manage pending uploads",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Upload Manager..." }],
      _meta: { ui: { resourceUri: "ui://files/upload" } }
    };
  }
);

// Tool: Access Control
server.tool(
  "file_access_control",
  "Manage file access permissions and sharing settings",
  {
    type: "object",
    properties: {
      file_id: {
        type: "string",
        description: "File ID to manage access for"
      }
    },
    required: ["file_id"]
  },
  async (args) => {
    const fileId = (args as { file_id: string }).file_id;

    return {
      content: [{ type: "text", text: `Managing access for file ${fileId}...` }],
      _meta: { ui: { resourceUri: `ui://files/access?file_id=${fileId}` } }
    };
  }
);

// Tool: Storage Analytics
server.tool(
  "storage_analytics",
  "View storage usage analytics and insights",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Loading Storage Analytics..." }],
      _meta: { ui: { resourceUri: "ui://files/analytics" } }
    };
  }
);

// UI Resources
server.resource(
  "ui://files/dashboard",
  "Files management dashboard",
  async () => ({
    contents: [{
      uri: "ui://files/dashboard",
      mimeType: "text/html",
      text: getDashboardHtml()
    }]
  })
);

server.resource(
  "ui://files/browser",
  "File browser",
  async () => ({
    contents: [{
      uri: "ui://files/browser",
      mimeType: "text/html",
      text: getBrowserHtml()
    }]
  })
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("23blocks Files App server running on stdio");
}

main().catch(console.error);

// HTML Templates

function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Files Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f2f5;
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
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary { background: #10b981; color: white; }
    .storage-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 24px;
      color: white;
      margin-bottom: 24px;
    }
    .storage-card h2 { font-size: 18px; margin-bottom: 16px; }
    .storage-bar {
      background: rgba(255,255,255,0.3);
      border-radius: 8px;
      height: 12px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .storage-bar-fill {
      background: white;
      height: 100%;
      width: 67%;
      border-radius: 8px;
    }
    .storage-stats {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }
    .categories {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .category-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .category-card:hover { transform: translateY(-2px); }
    .category-icon { font-size: 32px; margin-bottom: 8px; }
    .category-name { font-weight: 500; color: #1a1a2e; }
    .category-count { font-size: 13px; color: #6c757d; margin-top: 4px; }
    .recent-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .recent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .recent-header h3 { font-size: 16px; color: #1a1a2e; }
    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
    }
    .file-item {
      text-align: center;
      cursor: pointer;
      padding: 12px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .file-item:hover { background: #f8f9fa; }
    .file-icon { font-size: 40px; margin-bottom: 8px; }
    .file-name { font-size: 13px; color: #1a1a2e; word-break: break-word; }
    .file-size { font-size: 11px; color: #6c757d; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Files Dashboard</h1>
    <button class="btn btn-primary" onclick="openUpload()">
      <span>+</span> Upload Files
    </button>
  </div>

  <div class="storage-card">
    <h2>Storage Usage</h2>
    <div class="storage-bar">
      <div class="storage-bar-fill"></div>
    </div>
    <div class="storage-stats">
      <span>6.7 GB of 10 GB used</span>
      <span>3.3 GB available</span>
    </div>
  </div>

  <div class="categories">
    <div class="category-card" onclick="browseCategory('images')">
      <div class="category-icon">🖼️</div>
      <div class="category-name">Images</div>
      <div class="category-count">1,234 files</div>
    </div>
    <div class="category-card" onclick="browseCategory('documents')">
      <div class="category-icon">📄</div>
      <div class="category-name">Documents</div>
      <div class="category-count">567 files</div>
    </div>
    <div class="category-card" onclick="browseCategory('videos')">
      <div class="category-icon">🎬</div>
      <div class="category-name">Videos</div>
      <div class="category-count">89 files</div>
    </div>
    <div class="category-card" onclick="browseCategory('other')">
      <div class="category-icon">📁</div>
      <div class="category-name">Other</div>
      <div class="category-count">234 files</div>
    </div>
  </div>

  <div class="recent-section">
    <div class="recent-header">
      <h3>Recent Files</h3>
      <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px;">View All</a>
    </div>
    <div class="file-grid">
      <div class="file-item">
        <div class="file-icon">🖼️</div>
        <div class="file-name">screenshot.png</div>
        <div class="file-size">2.4 MB</div>
      </div>
      <div class="file-item">
        <div class="file-icon">📄</div>
        <div class="file-name">report.pdf</div>
        <div class="file-size">1.2 MB</div>
      </div>
      <div class="file-item">
        <div class="file-icon">📊</div>
        <div class="file-name">data.xlsx</div>
        <div class="file-size">856 KB</div>
      </div>
      <div class="file-item">
        <div class="file-icon">🎬</div>
        <div class="file-name">demo.mp4</div>
        <div class="file-size">45.2 MB</div>
      </div>
      <div class="file-item">
        <div class="file-icon">🖼️</div>
        <div class="file-name">banner.jpg</div>
        <div class="file-size">890 KB</div>
      </div>
    </div>
  </div>

  <script>
    function openUpload() {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'upload' }
      }, '*');
    }
    function browseCategory(category) {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'browser', category }
      }, '*');
    }
  </script>
</body>
</html>`;
}

function getBrowserHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
    }
    .toolbar {
      background: white;
      padding: 12px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .breadcrumb a { color: #667eea; text-decoration: none; }
    .breadcrumb span { color: #6c757d; }
    .search-box {
      padding: 8px 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      width: 250px;
    }
    .view-toggle {
      display: flex;
      gap: 4px;
    }
    .view-btn {
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      background: white;
      cursor: pointer;
    }
    .view-btn.active { background: #667eea; color: white; border-color: #667eea; }
    .content {
      display: flex;
      height: calc(100vh - 57px);
    }
    .sidebar {
      width: 240px;
      background: white;
      border-right: 1px solid #e0e0e0;
      padding: 16px;
    }
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-title { font-size: 12px; color: #6c757d; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; }
    .sidebar-item {
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .sidebar-item:hover { background: #f8f9fa; }
    .sidebar-item.active { background: #eef2ff; color: #667eea; }
    .main {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }
    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 16px;
    }
    .file-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    .file-card:hover { border-color: #667eea; }
    .file-card.selected { border-color: #667eea; background: #eef2ff; }
    .file-icon { font-size: 48px; margin-bottom: 12px; }
    .file-name { font-size: 13px; color: #1a1a2e; word-break: break-word; }
    .file-meta { font-size: 11px; color: #6c757d; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="breadcrumb">
      <a href="#">My Files</a>
      <span>/</span>
      <span>Images</span>
    </div>
    <input type="text" class="search-box" placeholder="Search files...">
    <div class="view-toggle">
      <button class="view-btn active">Grid</button>
      <button class="view-btn">List</button>
    </div>
  </div>

  <div class="content">
    <div class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">Quick Access</div>
        <div class="sidebar-item active">📁 All Files</div>
        <div class="sidebar-item">⭐ Starred</div>
        <div class="sidebar-item">🕐 Recent</div>
        <div class="sidebar-item">🗑️ Trash</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-title">Categories</div>
        <div class="sidebar-item">🖼️ Images</div>
        <div class="sidebar-item">📄 Documents</div>
        <div class="sidebar-item">🎬 Videos</div>
        <div class="sidebar-item">🎵 Audio</div>
      </div>
    </div>

    <div class="main">
      <div class="file-grid">
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">vacation-photo-1.jpg</div>
          <div class="file-meta">2.4 MB · Jan 15</div>
        </div>
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">product-banner.png</div>
          <div class="file-meta">1.8 MB · Jan 14</div>
        </div>
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">team-photo.jpg</div>
          <div class="file-meta">3.2 MB · Jan 12</div>
        </div>
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">logo-dark.svg</div>
          <div class="file-meta">24 KB · Jan 10</div>
        </div>
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">screenshot-app.png</div>
          <div class="file-meta">890 KB · Jan 8</div>
        </div>
        <div class="file-card">
          <div class="file-icon">🖼️</div>
          <div class="file-name">profile-avatar.jpg</div>
          <div class="file-meta">156 KB · Jan 5</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
