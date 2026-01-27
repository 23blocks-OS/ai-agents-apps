/**
 * 23blocks Forms App - MCP Server
 *
 * Provides interactive UIs for Forms Block:
 * - Forms Dashboard
 * - Survey Builder
 * - Submissions Viewer
 * - Analytics Dashboard
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateEnvVars } from "@23blocks/mcp-utils";

// Validate environment
const env = validateEnvVars();

// Create MCP server
const server = new McpServer({
  name: "23blocks-forms-app",
  version: "0.1.0"
});

// Tool: Forms Dashboard
server.tool(
  "forms_dashboard",
  "Open the forms management dashboard to view and manage all forms",
  {
    type: "object",
    properties: {}
  },
  async () => {
    return {
      content: [{ type: "text", text: "Opening Forms Dashboard..." }],
      _meta: { ui: { resourceUri: "ui://forms/dashboard" } }
    };
  }
);

// Tool: Survey Builder
server.tool(
  "survey_builder",
  "Open the interactive survey builder to create or edit surveys",
  {
    type: "object",
    properties: {
      survey_id: {
        type: "string",
        description: "Optional survey ID to edit existing survey"
      }
    }
  },
  async (args) => {
    const surveyId = (args as { survey_id?: string }).survey_id;
    const action = surveyId ? `Editing survey ${surveyId}` : "Creating new survey";

    return {
      content: [{ type: "text", text: `${action}...` }],
      _meta: {
        ui: {
          resourceUri: surveyId
            ? `ui://forms/survey-builder?id=${surveyId}`
            : "ui://forms/survey-builder"
        }
      }
    };
  }
);

// Tool: View Submissions
server.tool(
  "form_submissions",
  "View submissions for a specific form with filtering and export options",
  {
    type: "object",
    properties: {
      form_id: {
        type: "string",
        description: "Form ID to view submissions for"
      }
    },
    required: ["form_id"]
  },
  async (args) => {
    const formId = (args as { form_id: string }).form_id;

    return {
      content: [{ type: "text", text: `Loading submissions for form ${formId}...` }],
      _meta: { ui: { resourceUri: `ui://forms/submissions?form_id=${formId}` } }
    };
  }
);

// Tool: Forms Analytics
server.tool(
  "forms_analytics",
  "View analytics and insights for forms performance",
  {
    type: "object",
    properties: {
      form_id: {
        type: "string",
        description: "Optional form ID for specific form analytics"
      }
    }
  },
  async (args) => {
    const formId = (args as { form_id?: string }).form_id;

    return {
      content: [{ type: "text", text: "Loading Forms Analytics..." }],
      _meta: {
        ui: {
          resourceUri: formId
            ? `ui://forms/analytics?form_id=${formId}`
            : "ui://forms/analytics"
        }
      }
    };
  }
);

// UI Resources
server.resource(
  "ui://forms/dashboard",
  "Forms management dashboard",
  async () => ({
    contents: [{
      uri: "ui://forms/dashboard",
      mimeType: "text/html",
      text: getDashboardHtml()
    }]
  })
);

server.resource(
  "ui://forms/survey-builder",
  "Interactive survey builder",
  async () => ({
    contents: [{
      uri: "ui://forms/survey-builder",
      mimeType: "text/html",
      text: getSurveyBuilderHtml()
    }]
  })
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("23blocks Forms App server running on stdio");
}

main().catch(console.error);

// HTML Templates (will be replaced with bundled React app in production)

function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forms Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      padding: 24px;
    }
    .header {
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header h1 { color: #333; font-size: 24px; }
    .header p { color: #666; margin-top: 4px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .card h3 { color: #333; margin-bottom: 8px; }
    .card p { color: #666; font-size: 14px; }
    .stat {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    .stat-item { text-align: center; }
    .stat-value { font-size: 24px; font-weight: 600; color: #0066cc; }
    .stat-label { font-size: 12px; color: #999; }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-active { background: #d4edda; color: #155724; }
    .badge-draft { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Forms Dashboard</h1>
    <p>Manage your forms, surveys, and appointments</p>
  </div>
  <div class="grid">
    <div class="card" onclick="openSurveyBuilder()">
      <span class="badge badge-active">Active</span>
      <h3>Customer Feedback Survey</h3>
      <p>NPS and satisfaction questions</p>
      <div class="stat">
        <div class="stat-item">
          <div class="stat-value">342</div>
          <div class="stat-label">Responses</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">78%</div>
          <div class="stat-label">Completion</div>
        </div>
      </div>
    </div>
    <div class="card">
      <span class="badge badge-active">Active</span>
      <h3>Contact Form</h3>
      <p>Website contact requests</p>
      <div class="stat">
        <div class="stat-item">
          <div class="stat-value">89</div>
          <div class="stat-label">This Week</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">4.2h</div>
          <div class="stat-label">Avg Response</div>
        </div>
      </div>
    </div>
    <div class="card">
      <span class="badge badge-draft">Draft</span>
      <h3>Employee Onboarding</h3>
      <p>New hire information form</p>
      <div class="stat">
        <div class="stat-item">
          <div class="stat-value">0</div>
          <div class="stat-label">Responses</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">--</div>
          <div class="stat-label">Completion</div>
        </div>
      </div>
    </div>
  </div>
  <script>
    function openSurveyBuilder() {
      window.parent.postMessage({
        type: 'mcp-message',
        payload: { action: 'navigate', target: 'survey-builder', id: 'survey-1' }
      }, '*');
    }
  </script>
</body>
</html>`;
}

function getSurveyBuilderHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Survey Builder</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
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
    .toolbar h2 { flex: 1; font-size: 18px; }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-primary { background: #0066cc; color: white; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .content {
      display: flex;
      height: calc(100vh - 53px);
    }
    .sidebar {
      width: 280px;
      background: white;
      border-right: 1px solid #e0e0e0;
      padding: 16px;
    }
    .sidebar h3 { font-size: 14px; color: #666; margin-bottom: 12px; }
    .field-type {
      padding: 12px;
      background: #f8f8f8;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: grab;
    }
    .canvas {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }
    .question {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .question input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h2>Survey Builder</h2>
    <button class="btn btn-secondary">Preview</button>
    <button class="btn btn-primary">Save & Publish</button>
  </div>
  <div class="content">
    <div class="sidebar">
      <h3>Add Question</h3>
      <div class="field-type">Text Input</div>
      <div class="field-type">Multiple Choice</div>
      <div class="field-type">Rating Scale</div>
      <div class="field-type">Dropdown</div>
      <div class="field-type">Date Picker</div>
    </div>
    <div class="canvas">
      <div class="question">
        <input type="text" placeholder="Enter question text..." value="How satisfied are you with our service?">
      </div>
      <div class="question">
        <input type="text" placeholder="Enter question text..." value="Would you recommend us to others?">
      </div>
    </div>
  </div>
</body>
</html>`;
}
