# Backend Development Templates

This directory contains templates and guidelines for backend development in the SDUI/MFE platform.

## Tech Stack

- **Runtime**: Node.js 20+ with Fission Serverless
- **Framework**: Express.js (via Fission functions)
- **Database**: PostgreSQL with PgBouncer (connection pooling)
- **ORM**: Drizzle ORM
- **Container**: Docker
- **Orchestration**: Kubernetes (minikube for local)
- **Serverless**: Fission

## Project Structure

```
backend/
├── functions/
│   ├── api/              # API endpoint functions
│   │   ├── hello.js      # Example: GET /api/hello
│   │   ├── users.js      # User CRUD operations
│   │   └── ...
│   ├── gateway/          # Gateway/middleware functions
│   │   └── auth.js       # Authentication & authorization
│   └── data/             # Data access layer (future)
├── k8s/                  # Kubernetes manifests
│   ├── postgres.yaml     # PostgreSQL + PgBouncer
│   └── ...
├── migrations/           # Database migrations
│   ├── 001_initial_schema.sql
│   └── 002_users_table.sql
├── scripts/              # Utility scripts
│   ├── setup.sh         # Local dev setup
│   └── deploy.sh        # Deployment script
└── specs/               # API specifications
```

## Development Guidelines

### Function Creation

1. **API Functions**: Handle specific routes/resources
2. **Gateway Functions**: Handle auth, rate limiting, logging
3. **Data Functions**: Handle database operations (future)

### File Naming

- Functions: kebab-case (`user-profile.js`, `create-order.js`)
- Migrations: numbered descriptions (`001_initial_schema.sql`)
- K8s manifests: resource-name (`postgres.yaml`, `redis.yaml`)

### Error Handling

```javascript
// Always handle errors gracefully
try {
  // Your code
} catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: error.message,
      code: 'INTERNAL_ERROR',
    }),
  };
}
```

## Getting Started

See individual template directories for detailed examples:

- [API Functions](./functions/api/README.md)
- [Gateway Functions](./functions/gateway/README.md)
- [Migrations](./migrations/README.md)
- [K8s Manifests](./k8s/README.md)

## Quick Start

```bash
# 1. Setup local environment
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Deploy database
kubectl apply -f k8s/postgres.yaml

# 3. Run migrations
kubectl exec -it postgres-0 -n database -- psql -U admin -d app -f /migrations/001_initial_schema.sql

# 4. Deploy functions
fission function create --name hello --env nodejs --src functions/api/hello.js
```

## Best Practices

1. **Keep functions small**: Single responsibility per function
2. **Use environment variables**: Never hardcode secrets
3. **Validate input**: Use schemas for request validation
4. **Log appropriately**: Use structured logging
5. **Handle timeouts**: Set appropriate timeouts for external calls
6. **Use connection pooling**: PgBouncer for database connections
