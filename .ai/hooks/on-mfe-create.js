/**
 * .ai/hooks/on-mfe-create.js
 * Hook that runs after a new frontend MFE is created
 *
 * This hook can be used by AI agents to:
 * - Initialize component library
 * - Add routing configuration
 * - Set up state management
 * - Configure styling
 */

export async function run(context) {
  const { mfeName, mfePath, options } = context;

  console.log(`[AI Hook] MFE created: ${mfeName}`);
  console.log(`  Path: ${mfePath}`);

  // AI agents can extend this hook to:
  // 1. Generate base components
  // 2. Set up routing
  // 3. Configure state management
  // 4. Add example pages

  const tasks = [
    {
      type: 'components',
      description: 'Generate base UI components',
      enabled: true,
    },
    {
      type: 'routing',
      description: 'Set up routing configuration',
      enabled: true,
    },
    {
      type: 'testing',
      description: 'Create component tests',
      enabled: true,
    },
    {
      type: 'styling',
      description: 'Configure Tailwind CSS theme',
      enabled: true,
    },
  ];

  return {
    success: true,
    tasks,
    message: `MFE ${mfeName} is ready for AI enhancement`,
  };
}
