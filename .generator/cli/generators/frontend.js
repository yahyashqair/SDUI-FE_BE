/**
 * .generator/cli/generators/frontend.js
 * Frontend micro-frontend (MFE) generator
 */

import path from 'path';
import fs from 'fs/promises';
import { BaseGenerator } from './base.js';

export class FrontendGenerator extends BaseGenerator {
  /**
   * Create a new frontend MFE
   */
  async create(name, options) {
    const template = options.template || 'astro-mfe';
    const targetPath = path.join(options.path || '.', name);

    this.log(`Creating frontend MFE: ${name}`);

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
      path.join('frontend', template),
      targetPath,
      variables
    );

    this.log(`Created ${filesCreated} files`, 'success');

    // Create AI agent integration
    if (options.ai !== false) {
      await this.createAgentIntegration(targetPath, {
        type: 'frontend-mfe',
        name: name,
        instructions: [
          'Use Astro components for static content',
          'Use React components for interactivity',
          'Follow the Islands Architecture pattern',
          'Ensure responsive design',
          'Test components with Vitest',
        ],
        rules: [
          'Never commit secrets',
          'Use semantic HTML',
          'Ensure accessibility (WCAG 2.1 AA)',
          'Optimize images and assets',
        ],
      });
    }

    // Create README
    await this.createReadme(targetPath, {
      title: this.toPascalCase(name),
      description: `Frontend micro-frontend for ${name}`,
      framework: 'Astro + React',
      language: 'TypeScript',
      startCommand: 'npm run dev',
      testCommand: 'npm test',
      structure: ``
src/
├── components/   # UI components
│   ├── astro/    # Static components
│   ├── react/    # Interactive components
│   └── system/   # System components
├── layouts/      # Page layouts
├── pages/        # Routes
├── hooks/        # React hooks
├── services/     # API clients
├── types/        # TypeScript types
└── styles/       # Global styles
`,
    });

    this.log(`\nFrontend MFE created at: ${targetPath}`, 'success');
    this.log(`\nNext steps:`, 'info');
    this.log(`  cd ${name}`);
    this.log(`  npm install`);
    this.log(`  npm run dev`);
  }

  /**
   * Add frontend to existing project
   */
  async add(name, options) {
    const projectPath = options.path || '.';
    const frontendPath = path.join(projectPath, 'apps', name);

    this.log(`Adding frontend MFE to project: ${name}`);

    await this.create(name, { ...options, path: frontendPath });

    // Update project configuration
    await this.updateProjectConfig(projectPath, name);
  }

  /**
   * Update project configuration to include new frontend
   */
  async updateProjectConfig(projectPath, frontendName) {
    const configPath = path.join(projectPath, 'project.json');

    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      if (!config.apps) {
        config.apps = [];
      }

      config.apps.push({
        name: frontendName,
        path: `apps/${frontendName}`,
        port: 4000 + config.apps.length + 1,
        route: `/${frontendName}`,
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
