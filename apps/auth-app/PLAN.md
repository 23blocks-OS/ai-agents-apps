# Auth App - Shared Authentication Experiment

## Goal
Create an auth-only MCP App that logs in and shares the token with other MCP Apps.

## Options to Test

### 1. localStorage (Same Origin)
- **How**: Store token in `localStorage.setItem('23blocks_token', token)`
- **Read**: Other apps check `localStorage.getItem('23blocks_token')`
- **Requirement**: All apps must share same origin
- **Risk**: Sandboxed iframes may block storage access

### 2. BroadcastChannel (Same Origin)
- **How**: `new BroadcastChannel('23blocks_auth').postMessage({ token })`
- **Read**: Other apps listen on same channel
- **Requirement**: Same origin, apps must be open simultaneously
- **Risk**: May not work in sandboxed iframes

### 3. updateModelContext (MCP Protocol)
- **How**: `app.updateModelContext({ content: [{ type: 'text', text: JSON.stringify({ token }) }] })`
- **Read**: Model receives context, includes in future tool calls
- **Requirement**: Claude must understand and relay token
- **Risk**: Token visible in model context, not automatic

### 4. sendMessage with Token (MCP Protocol)
- **How**: Auth app sends `"User authenticated. Token: {token}"` to chat
- **Read**: Claude sees message, extracts token for other tools
- **Requirement**: Claude must parse and use token
- **Risk**: Token visible in chat history

### 5. Tool Result with Token (MCP Protocol)
- **How**: Auth tool returns `{ token }` in result
- **Read**: Claude stores token, passes to subsequent tool calls
- **Requirement**: Claude must be instructed to use token
- **Risk**: Requires Claude orchestration

## Implementation Plan

### Phase 1: Create auth-app
1. Create basic MCP App structure
2. Implement login form
3. On successful login:
   - Try localStorage (log success/failure)
   - Try BroadcastChannel (log success/failure)
   - Use updateModelContext with token
   - Send message confirming login

### Phase 2: Update forms-app to receive token
1. On load, check localStorage for token
2. Listen for BroadcastChannel messages
3. Accept token via URL param (for testing)
4. Accept token via tool input (if Claude passes it)

### Phase 3: Test in Claude Desktop
1. Call auth tool first
2. Then call forms_dashboard
3. See if token was shared via any method
4. Document what works

## Files to Create

```
apps/auth-app/
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
├── src/
│   ├── server/
│   │   └── index.ts      # MCP server with login tool
│   └── ui/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx       # Login form + storage tests
│       └── mcp-bridge.ts # Reuse from forms-app
└── PLAN.md
```

## Test Matrix

| Method | Test | Expected in Claude Desktop |
|--------|------|---------------------------|
| localStorage | Set/get | ❓ Unknown |
| sessionStorage | Set/get | ❓ Unknown |
| BroadcastChannel | Post/receive | ❓ Unknown |
| updateModelContext | Send token | ✅ Should work |
| sendMessage | Send token | ✅ Should work |

## Success Criteria

1. User logs in via auth-app
2. User opens forms-app WITHOUT logging in again
3. forms-app has access to the auth token

## Fallback Plan

If no automatic sharing works:
- Auth app sends structured message: `"AUTH_TOKEN:{token}"`
- Claude is instructed to pass token to subsequent tools
- Other tools accept `token` as optional parameter
