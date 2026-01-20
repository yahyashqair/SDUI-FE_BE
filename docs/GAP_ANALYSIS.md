# Gap Analysis & Improvement Plan

This document identifies current gaps in the implementation compared to a production-ready "Serverless Replit" vision, and suggests specific improvements.

## 1. Security & Isolation

**Current State**:
- Frontend: MFEs run in the browser (standard web security).
- Backend: User code runs via `child_process` on the host container or as Fission functions in a shared Kubernetes namespace.
- Database: SQLite files accessed directly by the runner.

**Gaps**:
- **No Strong Isolation**: A malicious tenant code could potentially access the host filesystem or affect other tenants' resources in the shared Fission environment.
- **Database Access**: Direct filesystem access limits scalability and security controls.

**Improvements**:
- [ ] **Firecracker / gVisor**: Execute tenant backend code in ephemeral MicroVMs.
- [ ] **Network Policies**: Restrict network access for tenant functions (allowlist only).
- [ ] **Database Service**: Move from direct SQLite file access to a managed LibSQL/sqld service for better auth and replication.

## 2. Release Pipeline

**Current State**:
- Supports creating immutable snapshots ("Releases").
- Supports "Direct Deployment" (activating a release globally).

**Gaps**:
- **No Environment Promotion**: Deployments affect the single "Production" environment immediately.
- **No Rollback UI**: While releases exist, there's no dedicated UI to "Rollback to V1".

**Improvements**:
- [ ] **Environments**: Introduce `dev`, `staging`, `prod` environments in the `releases` table.
- [ ] **Promotion Workflow**: `v1` (Dev) -> Test -> Promote to `v1` (Staging).
- [ ] **Rollback UI**: A simple "Restore this version" button in the Release Manager.

## 3. AI Agent Capabilities

**Current State**:
- Uses OpenAI API with Function Calling.
- Capable of creating/updating components, functions, and DB schemas.
- Self-correcting loop for tool errors.

**Gaps**:
- **Context Blindness**: The agent often overwrites files without fully reading the existing context, leading to regression.
- **Dependency Hell**: The agent cannot easily add generic NPM packages without breaking the build (missing `npm install` step).

**Improvements**:
- [ ] **Context Gathering**: Implement a "Read Phase" where the agent autonomously reads related files before planning edits.
- [ ] **Automated Dependency Management**: Detect imports in generated code and auto-run `npm install` in the tenant workspace.

## 4. Frontend Architecture

**Current State**:
- SDUI for layout, MFEs for custom logic.
- Runtime bundling with `esbuild`.

**Gaps**:
- **Styling Conflicts**: CSS from one MFE might bleed into another if not carefully scoped (Tailwind helps but isn't foolproof).
- **Bundle Size**: No shared chunk splitting between MFEs.

**Improvements**:
- [ ] **Shadow DOM**: Wrap MFEs in Shadow DOM for true style isolation.
- [ ] **Module Federation**: Use Webpack Module Federation or similar for better shared dependency management than raw `esbuild` bundles.

## 5. Documentation

**Current State**:
- Manual Markdown guides (`SDUI_GUIDE.md`, `README.md`).

**Gaps**:
- Docs can easily drift from code (e.g., API signatures change).

**Improvements**:
- [ ] **Auto-Generated Docs**: Use TypeDoc for TS libraries and Swagger/OpenAPI for the Backend API.
