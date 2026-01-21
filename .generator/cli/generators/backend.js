/**
 * .generator/cli/generators/backend.js
 * Backend microservice generator
 */

import path from 'path';
import fs from 'fs/promises';
import { BaseGenerator } from './base.js';

export class BackendGenerator extends BaseGenerator {
  /**
   * Create a new backend microservice
   */
  async create(name, options) {
    const template = options.template || 'express-api';
    const targetPath = path.join(options.path || '.', name);

    this.log(`Creating backend microservice: ${name}`);

    // Variables for template replacement
    const variables = {
      NAME: name,
      NAME_KEBAB: name.toLowerCase().replace(/\s+/g, '-'),
      NAME_CAMEL: this.toCamelCase(name),
      NAME_PASCAL: this.toPascalCase(name),
      YEAR: new Date().getFullYear(),
      AUTHOR: process.env.USER || 'Developer',
    };

    // Copy template
    const filesCreated = await this.copyTemplate(
      path.join('backend', template),
      targetPath,
      variables
    );

    this.log(`Created ${filesCreated} files`, 'success');

    // Create AI agent integration
    if (options.ai !== false) {
      await this.createAgentIntegration(targetPath, {
        type: 'backend-microservice',
        name: name,
        instructions: [
          'Follow REST API best practices',
          'Implement proper error handling',
          'Add input validation with Zod schemas',
          'Write unit tests for all endpoints',
          'Document API with OpenAPI/Swagger',
        ],
        rules: [
          'Never hardcode secrets',
          'Always sanitize user input',
          'Use environment variables for configuration',
        ],
      });
    }

    // Create README
    await this.createReadme(targetPath, {
      title: this.toPascalCase(name),
      description: `Backend microservice for ${name}`,
      framework: 'Express.js',
      language: 'TypeScript',
      startCommand: 'npm run dev',
      testCommand: 'npm test',
      structure: ``
src/
├── routes/       # API routes
├── controllers/  # Request handlers
├── services/     # Business logic
├── models/       # Data models
├── middleware/   # Express middleware
├── utils/        # Utilities
└── index.ts      # Entry point
`,
    });

    this.log(`\nBackend microservice created at: ${targetPath}`, 'success');
    this.log(`\nNext steps:`, 'info');
    this.log(`  cd ${name}`);
    this.log(`  npm install`);
    this.log(`  npm run dev`);
  }

  /**
   * Add backend to existing project
   */
  async add(name, options) {
    const projectPath = options.path || '.';
    const backendPath = path.join(projectPath, 'backend', name);

    this.log(`Adding backend microservice to project: ${name}`);

    await this.create(name, { ...options, path: backendPath });

    // Update project configuration
    await this.updateProjectConfig(projectPath, name);
  }

  /**
   * Update project configuration to include new backend
   */
  async updateProjectConfig(projectPath, backendName) {
    const configPath = path.join(projectPath, 'project.json');

    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      if (!config.backends) {
        config.backends = [];
      }

      config.backends.push({
        name: backendName,
        path: `backend/${backendName}`,
        port: 3000 + config.backends.length + 1,
        routes: `/${backendName}`,
      });

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      this.log(`Updated project configuration`, 'success');
    } catch {
      // No project.json, skip
    }
  }

  toCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  toPascalCase(str) {
    return str
      .toLowerCase()
      .replace(/(^|[^a-z0-9]+)(.)/g, (_, _, chr) => chr.toUpperCase());
  }
}
