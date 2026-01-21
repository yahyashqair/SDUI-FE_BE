# Frontend Template (Micro-Frontend)

This template is designed for building Remote Modules for the Nexus Platform.

## Structure

*   **src/bootstrap.tsx**: Entry point for local development.
*   **src/App.tsx**: Main component exposed via Module Federation.
*   **src/components**: Reusable UI components.
*   **src/pages**: Route components.

## Rules

1.  **Exposed Module**: The `App` component is exposed as the entry point for the Shell Application.
2.  **State**: Use URL-based state where possible to support deep linking.
3.  **Dependencies**: `react` and `react-dom` are shared dependencies.

## Verification

The Verification Gate will check that the module builds correctly and exposes the required entry point.
