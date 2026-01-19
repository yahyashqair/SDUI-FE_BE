#!/bin/bash
# ============================================================
# Run Database Migrations
# Executes SQL migrations against PostgreSQL
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$(dirname "$SCRIPT_DIR")/migrations"

echo "🗄️  Running database migrations..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n database --timeout=120s

# Copy migration file to pod
kubectl cp "$MIGRATIONS_DIR/001_initial_schema.sql" database/postgres-0:/tmp/001_initial_schema.sql

# Run migration
kubectl exec -n database postgres-0 -- psql -U sdui_admin -d sdui_db -f /tmp/001_initial_schema.sql

echo "✅ Migrations complete!"
