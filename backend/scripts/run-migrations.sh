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

# Copy all migration files to pod
kubectl cp "$MIGRATIONS_DIR/" database/postgres-0:/tmp/migrations/

# Run all migrations
for file in "$MIGRATIONS_DIR"/*.sql; do
    filename=$(basename "$file")
    echo "Running $filename..."
    kubectl exec -n database postgres-0 -- psql -h 127.0.0.1 -U sdui_admin -d sdui_db -f "/tmp/migrations/$filename"

done

echo "✅ Migrations complete!"
