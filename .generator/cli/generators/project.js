/**
 * .generator/cli/generators/project.js
 * Full project generator (monorepo with microservices and MFEs)
 */

import path from 'path';
import fs from 'fs/promises';
import { BaseGenerator } from './base.js';

export class ProjectGenerator extends BaseGenerator {
  /**
   * Create a new project with monorepo setup
   */
  async create(name, options) {
    const template = options.template || 'monorepo-fullstack';
    const targetPath = path.join(options.path || '.', name);

    this.log(`Creating new project: ${name}`);

    // Variables for template replacement
    const variables = {
      NAME: name,
      NAME_KEBAB: name.toLowerCase().replace(/\s+/g, '-'),
      NAME_CAMEL: this.toCamelCase(name),
      NAME_PASCAL: this.toPascalCase(name),
      YEAR: new Date().getFullYear(),
      AUTHOR: process.env.USER || 'Developer',
    };

    // Copy base project template
    const filesCreated = await this.copyTemplate(
      path.join('project', template),
      targetPath,
      variables
    );

    this.log(`Created ${filesCreated} files`, 'success');

    // Create AI agent integration at project level
    if (options.ai !== false) {
      await this.createProjectAgentConfig(targetPath, name);
    }

    // Create directories
    await this.createProjectStructure(targetPath);

    // Create project configuration
    await this.createProjectConfig(targetPath, name);

    // Create README
    await this.createReadme(targetPath, {
      title: this.toPascalCase(name),
      description: `Full-stack project with microservices and MFEs`,
      framework: 'Astro + Express',
      language: 'TypeScript',
      startCommand: 'npm run dev',
      testCommand: 'npm run test',
      structure: ``
project/
├── apps/           # Frontend MFEs
│   ├── shell/      # Main shell application
│   └── */          # Feature MFEs
├── services/       # Backend microservices
│   ├── api/        # API gateway
│   └── */          # Feature services
├── packages/       # Shared packages
│   ├── ui/         # Shared UI components
│   ├── config/     # Shared configuration
│   └── types/      # Shared types
├── .ai/            # AI agent configurations
├── templates/      # Code generation templates
└── scripts/        # Build and deployment scripts
`,
    });

    this.log(`\nProject created at: ${targetPath}`, 'success');
    this.log(`\nNext steps:`, 'info');
    this.log(`  cd ${name}`);
    this.log(`  npm install`);
    this.log(`  npm run dev`);

    this.log(`\nAdd microservices:`, 'info');
    this.log(`  npm run create backend <name>`);
    this.log(`  npm run create frontend <name>`);
  }

  /**
   * Create project directory structure
   */
  async createProjectStructure(targetPath) {
    const dirs = [
      'apps',
      'apps/shell',
      'services',
      'services/api',
      'packages/ui',
      'packages/config',
      'packages/types',
      'templates/frontend',
      'templates/backend',
      '.ai',
    ];

    for (const dir of dirs) {
      const dirPath = path.join(targetPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    this.log('Created project directory structure');
  }

  /**
   * Create AI agent configuration at project level
   */
  async createProjectAgentConfig(targetPath, name) {
    const agentConfig = {
      version: '1.0.0',
      projectName: name,
      createdAt: new Date().toISOString(),

      // Agent coordination settings
      coordination: {
        mode: 'hierarchical',
        maxAgents: 10,
        timeout: 300000,
      },

      // Project-level agents
      agents: {
        architect: {
          model: 'claude-opus-4-5',
          role: 'system-architect',
          instructions: [
            'Maintain consistency across microservices and MFEs',
            'Ensure proper separation of concerns',
            'Follow SOLID principles',
            'Design for scalability',
          ],
        },

        reviewer: {
          model: 'claude-opus-4-5',
          role: 'code-reviewer',
          rules: [
            'Ensure code follows project standards',
            'Check for security vulnerabilities',
            'Validate performance considerations',
            'Verify test coverage',
          ],
        },

        tester: {
          model: 'claude-opus-4-5',
          role: 'tester',
          coverage: 80,
          frameworks: ['vitest', 'playwright'],
        },
      },

      // Hooks for agent integration
      hooks: {
        onServiceCreate: '.ai/hooks/on-service-create.js',
        onMFECreate: '.ai/hooks/on-mfe-create.js',
        preCommit: '.ai/hooks/pre-commit.js',
        postGen: '.ai/hooks/post-gen.js',
      },

      // Templates for code generation
      templates: {
        backend: 'templates/backend',
        frontend: 'templates/frontend',
      },
    };

    const agentPath = path.join(targetPath, '.ai', 'project.json');
    await fs.mkdir(path.dirname(agentPath), { recursive: true });
    await fs.writeFile(agentPath, JSON.stringify(agentConfig, null, 2));

    this.log(`Created AI agent configuration: ${agentPath}`);
  }

  /**
   * Create project configuration file
   */
  async createProjectConfig(targetPath, name) {
    const config = {
      name: name,
      version: '0.0.1',
      type: 'monorepo',
      createdAt: new Date().toISOString(),

      // Applications (MFEs)
      apps: [
        {
          name: 'shell',
          path: 'apps/shell',
          port: 3000,
          route: '/',
        },
      ],

      // Services (backend microservices)
      services: [
        {
          name: 'api',
          path: 'services/api',
          port: 4000,
          routes: '/api',
        },
      ],

      // Shared packages
      packages: {
        ui: 'packages/ui',
        config: 'packages/config',
        types: 'packages/types',
      },

      // Build configuration
      build: {
        parallel: true,
        cache: true,
        output: 'dist',
      },

      // Deployment
      deployment: {
        type: 'kubernetes',
        namespace: name,
      },

      // AI agent settings
      ai: {
        enabled: true,
        autoEnhance: true,
        reviewOnCommit: true,
      },
    };

    const configPath = path.join(targetPath, 'project.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    this.log(`Created project configuration: ${configPath}`);
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
