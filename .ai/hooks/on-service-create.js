/**
 * .ai/hooks/on-service-create.js
 * Hook that runs after a new backend service is created
 *
 * This hook can be used by AI agents to:
 * - Initialize testing setup
 * - Add default routes
 * - Configure documentation
 * - Set up monitoring
 */

export async function run(context) {
  const { serviceName, servicePath, options } = context;

  console.log(`[AI Hook] Service created: ${serviceName}`);
  console.log(`  Path: ${servicePath}`);

  // AI agents can extend this hook to:
  // 1. Generate initial API documentation
  // 2. Create test files
  // 3. Set up monitoring
  // 4. Add example routes

  const tasks = [
    {
      type: 'documentation',
      description: 'Generate OpenAPI documentation',
      enabled: true,
    },
    {
      type: 'testing',
      description: 'Create test suite',
      enabled: true,
    },
    {
      type: 'monitoring',
      description: 'Set up health checks and metrics',
      enabled: true,
    },
  ];

  return {
    success: true,
    tasks,
    message: `Service ${serviceName} is ready for AI enhancement`,
  };
}
