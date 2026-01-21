/**
 * .ai/hooks/pre-commit.js
 * Hook that runs before code is committed
 *
 * This hook can be used by AI agents to:
 * - Run tests
 * - Check code quality
 * - Verify no secrets are committed
 * - Format code
 */

import { execSync } from 'child_process';

export async function run(context) {
  const { files, message } = context;

  console.log(`[AI Hook] Pre-commit check`);

  const results = {
    tests: { passed: false, message: '' },
    lint: { passed: false, message: '' },
    secrets: { passed: true, message: '' },
    format: { passed: false, message: '' },
  };

  // Run tests
  try {
    execSync('npm run test:run', { stdio: 'pipe' });
    results.tests.passed = true;
    results.tests.message = 'All tests passed';
  } catch (error) {
    results.tests.message = 'Tests failed';
  }

  // Run linter
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    results.lint.passed = true;
    results.lint.message = 'No lint errors';
  } catch (error) {
    results.lint.message = 'Lint errors found';
  }

  // Check for secrets (basic check)
  const secretPatterns = [
    /password\s*=\s*['"].+['"]/i,
    /api[_-]?key\s*=\s*['"].+['"]/i,
    /secret\s*=\s*['"].+['"]/i,
    /token\s*=\s*['"].+['"]/i,
  ];

  for (const file of files) {
    const content = require('fs').readFileSync(file, 'utf-8');
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        results.secrets.passed = false;
        results.secrets.message = `Potential secret found in ${file}`;
        break;
      }
    }
  }

  // Return results
  const allPassed = Object.values(results).every((r) => r.passed);

  return {
    success: allPassed,
    results,
    message: allPassed
      ? 'Pre-commit checks passed'
      : 'Pre-commit checks failed',
  };
}
