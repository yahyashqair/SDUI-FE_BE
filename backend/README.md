# Fission Backend for SDUI

Serverless backend for the SDUI/MFE platform using Fission on Kubernetes.

## Quick Start

```bash
# 1. Setup local Kubernetes + Fission
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Deploy PostgreSQL + PgBouncer
kubectl apply -f k8s/

# 3. Run database migrations
kubectl exec -it -n database postgres-0 -- psql -U sdui_admin -d sdui_db -f /migrations/001_initial_schema.sql

# 4. Deploy functions
chmod +x scripts/deploy-functions.sh
./scripts/deploy-functions.sh

# 5. Test
fission function test --name hello
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────>│  Fission Router │────>│  Functions      │
│   (MFE/SDUI)    │     │                 │     │  (Node.js)      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐     ┌────────▼────────┐
                        │   PostgreSQL    │<────│   PgBouncer     │
                        │                 │     │   (Pooling)     │
                        └─────────────────┘     └─────────────────┘
```

## Functions

| Function | Route | Description |
|----------|-------|-------------|
| `hello` | `GET /api/hello` | Test function |
| `sdui-config` | `GET /api/sdui/config?path=/` | Get SDUI page config |
| `mfe-registry` | `GET /api/mfe/registry` | Get MFE registry |
| `auth` | `POST /api/auth/login` | Login |
| `auth` | `GET /api/auth/verify` | Verify token |

## Project Structure

```
backend/
├── scripts/
│   ├── setup.sh              # Install minikube + Fission
│   └── deploy-functions.sh   # Deploy all functions
├── k8s/
│   └── postgres.yaml         # PostgreSQL + PgBouncer
├── functions/
│   ├── gateway/
│   │   └── auth.js           # Authentication
│   ├── api/
│   │   ├── hello.js          # Test function
│   │   ├── sdui-config.js    # SDUI config API
│   │   └── mfe-registry.js   # MFE registry API
│   └── data/                 # Data access (future)
└── migrations/
    └── 001_initial_schema.sql
```

## Requirements

- Docker
- 8GB+ RAM for minikube
- Linux or macOS

## Useful Commands

```bash
# Check Fission status
fission env list
fission function list
fission route list

# View function logs
fission function logs --name sdui-config

# Get router URL
minikube service fission-router -n fission --url

# Access PostgreSQL
kubectl exec -it -n database postgres-0 -- psql -U sdui_admin -d sdui_db
```

## Connect Frontend

Update your frontend to call the Fission backend:

```typescript
// In your MFE or SDUI config
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:31314';

const response = await fetch(`${BACKEND_URL}/api/sdui/config?path=${path}`);
const config = await response.json();
```
