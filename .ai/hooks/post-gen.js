/**
 * .ai/hooks/post-gen.js
 * Hook that runs after code generation
 *
 * This hook can be used by AI agents to:
 * - Format generated code
 * - Add documentation
 * - Create tests
 * - Validate generated code
 */

export async function run(context) {
  const { generator, target, files } = context;

  console.log(`[AI Hook] Post-generation: ${generator}`);
  console.log(`  Target: ${target}`);
  console.log(`  Files: ${files.length} created`);

  // AI agents can extend this hook to:
  // 1. Format code with prettier
  // 2. Generate documentation
  // 3. Create test files
  // 4. Run initial validation

  const enhancements = [
    {
      type: 'format',
      description: 'Format generated code',
      command: 'prettier --write "**/*.{js,ts,jsx,tsx,json,md}"',
    },
    {
      type: 'docs',
      description: 'Generate documentation',
      command: 'typedoc',
    },
    {
      type: 'validate',
      description: 'Validate TypeScript',
      command: 'tsc --noEmit',
    },
  ];

  return {
    success: true,
    enhancements,
    message: `Generated code is ready for AI enhancement`,
  };
}
