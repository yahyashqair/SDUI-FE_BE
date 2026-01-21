/**
 * .generator/cli/generators/base.js
 * Base generator class with common functionality
 */

import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

export class BaseGenerator {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.templatesDir = path.join(rootDir, '.generator', 'templates');
  }

  /**
   * Copy template files to target directory
   */
  async copyTemplate(templateName, targetDir, variables = {}) {
    const templatePath = path.join(this.templatesDir, templateName);

    // Check if template exists
    try {
      await fs.access(templatePath);
    } catch {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Get all files in template
    const files = await glob('**/*', {
      cwd: templatePath,
      dot: true,
      nodir: true,
      ignore: ['**/template.json', '**/.git/**'],
    });

    // Copy each file and replace variables
    for (const file of files) {
      const sourcePath = path.join(templatePath, file);
      const targetPath = path.join(targetDir, this.replaceVariables(file, variables));

      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      // Read and process file
      let content = await fs.readFile(sourcePath, 'utf-8');

      // Replace variables in content
      content = this.replaceVariables(content, variables);

      // Write to target
      await fs.writeFile(targetPath, content);

      this.log(`Created: ${targetPath}`);
    }

    return files.length;
  }

  /**
   * Replace template variables
   */
  replaceVariables(content, variables) {
    let result = content;

    // Replace {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Read template metadata
   */
  async getTemplateMeta(templateName, type) {
    const metaPath = path.join(this.templatesDir, type, templateName, 'template.json');

    try {
      const content = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {
        name: templateName,
        type,
        description: `${type} template`,
        variables: [],
      };
    }
  }

  /**
   * Execute post-generation scripts
   */
  async executePostGenScripts(targetDir, templateName) {
    const scriptPath = path.join(
      this.templatesDir,
      templateName,
      'postgen.js'
    );

    try {
      await fs.access(scriptPath);
      const { run } = await import(`file://${scriptPath}`);
      await run(targetDir);
      this.log(`Executed post-generation script for ${templateName}`);
    } catch {
      // No post-gen script, skip
    }
  }

  /**
   * Create AI agent integration file
   */
  async createAgentIntegration(targetDir, config) {
    const agentConfig = {
      version: '1.0.0',
      type: config.type,
      name: config.name,
      createdAt: new Date().toISOString(),
      agents: {
        coder: {
          enabled: true,
          model: 'claude-opus-4-5',
          instructions: config.instructions || [],
        },
        reviewer: {
          enabled: true,
          rules: config.rules || [],
        },
        tester: {
          enabled: true,
          coverage: config.coverage || 80,
        },
      },
      hooks: {
        preEdit: [],
        postEdit: [],
        preCommit: [],
      },
    };

    const agentPath = path.join(targetDir, '.ai', 'config.json');
    await fs.mkdir(path.dirname(agentPath), { recursive: true });
    await fs.writeFile(agentPath, JSON.stringify(agentConfig, null, 2));

    this.log(`Created AI agent configuration: ${agentPath}`);
  }

  /**
   * Create package.json with dependencies
   */
  async createPackageJson(targetDir, config) {
    const pkgPath = path.join(targetDir, 'package.json');

    const packageJson = {
      name: config.name,
      version: config.version || '0.0.1',
      type: config.type || 'module',
      scripts: config.scripts || {},
      dependencies: config.dependencies || {},
      devDependencies: config.devDependencies || {},
    };

    await fs.writeFile(pkgPath, JSON.stringify(packageJson, null, 2));
    this.log(`Created package.json: ${pkgPath}`);
  }

  /**
   * Log output
   */
  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    };

    const color = colors[type] || colors.info;
    const reset = '\x1b[0m';

    console.log(`${color}➜${reset} ${message}`);
  }

  /**
   * Generate README.md
   */
  async createReadme(targetDir, config) {
    const readmePath = path.join(targetDir, 'README.md');

    const readme = `# ${config.title}

${config.description}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development
${config.startCommand || 'npm run dev'}

# Run tests
${config.testCommand || 'npm test'}
\`\`\`

## Project Structure

${config.structure || 'TODO: Add structure'}

## AI Agent Integration

This project is configured for AI agent development.

\`\`\`bash
# Let AI agents enhance the code
npm run agent:enhance

# Fix issues with AI
npm run agent:fix
\`\`\`

## Development

- **Framework**: ${config.framework || 'N/A'}
- **Language**: ${config.language || 'TypeScript/JavaScript'}
- **Package Manager**: npm

## License

${config.license || 'MIT'}
`;

    await fs.writeFile(readmePath, readme);
    this.log(`Created README.md: ${readmePath}`);
  }

  /**
   * Run npm install in target directory
   */
  async installDependencies(targetDir) {
    const { spawn } = await import('child_process');

    this.log('Installing dependencies...');

    return new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install'], {
        cwd: targetDir,
        stdio: 'inherit',
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.log('Dependencies installed', 'success');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }
}
