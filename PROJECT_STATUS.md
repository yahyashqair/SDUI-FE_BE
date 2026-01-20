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
- **Status**: **Fully Integrated**. Uses a generic OpenAI-compatible API (configured via `.env`) to plan and execute tools. Includes a self-correcting feedback loop where tool execution errors are fed back to the AI for resolution.

### 2. Release Pipeline & MFE Registry
- **Registry**: A PostgreSQL-backed registry (`mfe_registry`) tracks all Micro-Frontend versions and their active status.
- **Releases**: A `releases` table stores snapshots of the entire platform (MFEs + Functions).
- **Deployment**:
    - **Snapshot**: Create a immutable release version (e.g., `v1.0.0`) comprising specific artifact versions.
    - **Activation**: "Direct Deployment" updates the registry to serve the artifacts from the chosen release.
- **Fission Backend**:
    - `api/releases.js`: Handles release creation and deployment logic.

### 3. MFE Pipeline (`src/runtime/bundler.ts`, `src/pages/api/mfe/...`)
- **Generation**: AI writes `.tsx` files.
- **Build**: `esbuild` compiles these into standalone ESM bundles in `data/tenants/<id>/dist`.
- **Serving**: An API route serves these bundles.
- **Consumption**: The `RemoteRenderer` component loads these bundles at runtime into the React application.

### 4. Backend Runtime (Fission + Postgres)
- **Execution**: Serverless functions run on Fission (Kubernetes).
- **Data**: Centralized PostgreSQL database with `pgbouncer` for connection pooling.
- **Functions**:
    - `mfe-registry`: Serves MFE metadata.
    - `releases`: Manages release lifecycle.
    - `sdui-config`: Serves UI layouts.

### 5. Builder UI (`src/pages/builder` & `MasterDashboard`)
- **Interface**: A web-based IDE and Control Plane.
    - **AI Chat**: Chat with the agent to generate apps.
    - **Master Dashboard**: Manage MFEs, Functions, Routes, and **Releases**.
    - **Visual Editors**: View/Edit generated code and schemas.

## Current Limitations

1.  **Security**:
    - **Sandboxing**: While Fission provides some isolation, tenant code execution needs stricter security boundaries (e.g., gVisor or Firecracker) for a public multi-tenant SaaS.

2.  **Frontend Bundling**:
    - **Dependencies**: MFEs currently assume `react` and `react-dom` are external. Creating components requiring other 3rd-party libs requires `npm install` support in the build pipeline.

3.  **Observability**:
    - **Logs**: We can view Fission logs, but a centralized user-facing log stream for their specific functions is work-in-progress.

## Conclusion

The project has achieved its core architectural goals: **Real AI-driven development**, **Serverless Backend**, and a **Robust Release Pipeline**. The Master Control Panel provides a comprehensive interface for managing this distributed system.
