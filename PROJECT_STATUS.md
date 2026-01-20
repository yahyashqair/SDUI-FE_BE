# Project Status: AI-Centric Serverless MFE Builder

## Overview

This project realizes the vision of a "Serverless Replit" where an AI Agent acts as the primary architect and developer. It allows users to prompt an AI to generate complete web applications consisting of:

1.  **Micro Frontends (MFE)**: React components generated as source code, bundled on the fly, and served via a serverless bundler pipeline.
2.  **Serverless Backend**: Node.js functions stored in a git-backed file system, executed in isolated runtime contexts.
3.  **Real Database**: Managed SQLite databases for each tenant, with schema management handled by the AI.
4.  **Server-Driven UI (SDUI)**: A JSON-based UI schema that acts as the "glue" between the generic app shell and the specific MFEs/Backend functions, reducing AI hallucination errors.

## Current Architecture

### 1. The AI Agent (`src/lib/ai/agent.ts`, `tools.ts`)
- **Structure**: Modeled after an OpenAI Function Calling agent. It receives a prompt and decides which "Tools" to execute.
- **Tools**:
    - `updateDatabaseSchema`: Applies DDL to the tenant's SQLite DB.
    - `createBackendFunction`: Writes Node.js code to `data/tenants/<id>/src/`.
    - `createFrontendComponent`: Writes React code to `data/tenants/<id>/src/frontend/` and triggers a build.
    - `updateUILayout`: Updates the SDUI JSON Blueprint.
- **Status**: Currently mocks the LLM "planning" phase but fully executes the tools on the actual filesystem and database.

### 2. MFE Pipeline (`src/runtime/bundler.ts`, `src/pages/api/mfe/...`)
- **Generation**: AI writes `.tsx` files.
- **Build**: `esbuild` compiles these into standalone ESM bundles in `data/tenants/<id>/dist`.
- **Serving**: An API route serves these bundles.
- **Consumption**: The `RemoteRenderer` component loads these bundles at runtime into the React application.

### 3. Backend Runtime (`src/runtime/executor.ts`, `src/db/fs.ts`)
- **Storage**: Multi-file projects stored in `data/tenants/<id>/src`.
- **Execution**: `child_process` spawns a Node.js runner that loads the user code and injects a database connection helper (`lib/db.js`).
- **Database**: `better-sqlite3` provides fast, synchronous access to isolated tenant DBs.

### 4. Builder UI (`src/pages/builder`)
- **Interface**: A web-based IDE that allows:
    - Chatting with the AI to generate apps.
    - Viewing/Editing the generated file system (Frontend & Backend).
    - Viewing/Editing the UI Schema.
    - Committing changes to Git.

## Current Limitations

1.  **Security**:
    - **Code Execution**: User code runs on the host machine via `child_process`. This is unsafe for a public multi-tenant environment. **Recommendation**: Move to Firecracker microVMs or a sandboxed runtime like `deno` or `isolated-vm` for production.
    - **Database**: Direct file access to SQLite is fast but limits horizontal scaling. **Recommendation**: Use a proper database service or LibSQL for replication.

2.  **AI Integration**:
    - **Mocked Intelligence**: The current "Planner" is a hardcoded mock for a Todo App scenario. **Action**: Replace `mockPlanner` with a real call to `openai.chat.completions.create`.
    - **Context Window**: The agent doesn't yet "read" existing files to make iterative edits; it mostly overwrites.

3.  **Frontend Bundling**:
    - **Dependencies**: MFEs currently assume `react` and `react-dom` are external. If the AI generates code using other libraries (e.g., `lodash`), the build will fail unless we add a package manager step (`npm install` in tenant dir).

4.  **Error Handling**:
    - Runtime errors in user functions are caught but debugging is limited to console logs returned in the JSON response.

## Conclusion

The project successfully demonstrates the *architectural pattern* of an AI-driven, serverless, MFE-based app builder. It fulfills the core requirement of "limiting AI errors" by using SDUI for layout while allowing flexibility via MFEs for custom logic.
