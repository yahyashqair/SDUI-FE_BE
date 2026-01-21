# Backend Template (DDD)

This template enforces Domain-Driven Design (DDD) architecture.

## Structure

*   **src/domain**: Entities, Value Objects. Pure logic, no dependencies.
*   **src/application**: Use Cases, Commands, Queries. Orchestrates domain logic.
*   **src/infrastructure**: Database adapters, API routes, external libraries.
*   **src/interface**: HTTP/gRPC handlers. Adapts external requests to application use cases.

## Rules

1.  **Domain** layer cannot import from any other layer.
2.  **Application** layer can only import from **Domain**.
3.  **Infrastructure** layer can import from **Domain** and **Application**.
4.  **Interface** layer can import from **Application**.

## Verification

The Verification Gate will automatically check these rules. Violations will prevent deployment.
