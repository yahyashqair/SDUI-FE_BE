#!/usr/bin/env node
/**
 * .generator/cli/index.js
 * Main CLI entry point for generating microservices and MFEs
 *
 * Usage:
 *   node .generator/cli/index.js create backend <name> [options]
 *   node .generator/cli/index.js create frontend <name> [options]
 *   node .generator/cli/index.js create project <name> [options]
 */

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

const program = new Command();

program
  .name('generator')
  .description('Generate microservices, MFEs, and projects')
  .version('1.0.0');

// ============================================================================
// CREATE COMMANDS
// ============================================================================

program
  .command('create')
  .description('Create new resources')
  .argument('<type>', 'Type of resource: project, backend, frontend, mfe')
  .argument('<name>', 'Name of the resource')
  .option('-p, --path <path>', 'Target path', '.')
  .option('-t, --template <template>', 'Template to use')
  .option('--ai', 'Enable AI agent integration', true)
  .option('--no-ai', 'Disable AI agent integration')
  .action(async (type, name, options) => {
    try {
      const generator = await getGenerator(type);
      await generator.create(name, options);
    } catch (error) {
      console.error(`Error creating ${type}:`, error.message);
      process.exit(1);
    }
  });

// ============================================================================
// ADD COMMANDS - Add to existing project
// ============================================================================

program
  .command('add')
  .description('Add to existing project')
  .argument('<type>', 'Type to add: backend, frontend, mfe')
  .argument('<name>', 'Name of the resource')
  .option('-p, --path <path>', 'Project path', '.')
  .option('-t, --template <template>', 'Template to use')
  .action(async (type, name, options) => {
    try {
      const generator = await getGenerator(type);
      await generator.add(name, options);
    } catch (error) {
      console.error(`Error adding ${type}:`, error.message);
      process.exit(1);
    }
  });

// ============================================================================
// LIST COMMANDS
// ============================================================================

program
  .command('list')
  .description('List available templates')
  .argument('[type]', 'Filter by type: backend, frontend, mfe')
  .action(async (type) => {
    const templates = await listTemplates(type);
    console.log('\nAvailable templates:\n');
    for (const template of templates) {
      console.log(`  • ${template.name} - ${template.description}`);
    }
  });

// ============================================================================
// AGENT COMMANDS - AI agent integration
// ============================================================================

program
  .command('agent')
  .description('AI agent operations')
  .argument('<action>', 'Action: init, enhance, fix')
  .argument('<target>', 'Target path or name')
  .option('-m, --model <model>', 'AI model to use', 'claude-opus-4-5')
  .option('-t, --task <task>', 'Specific task description')
  .action(async (action, target, options) => {
    try {
      const agent = await getAgent();
      await agent[action](target, options);
    } catch (error) {
      console.error(`Agent error:`, error.message);
      process.exit(1);
    }
  });

// ============================================================================
// GENERATOR FACTORY
// ============================================================================

async function getGenerator(type) {
  const generators = {
    project: (await import('./generators/project.js')).ProjectGenerator,
    backend: (await import('./generators/backend.js')).BackendGenerator,
    frontend: (await import('./generators/frontend.js')).FrontendGenerator,
    mfe: (await import('./generators/mfe.js')).MFEGenerator,
  };

  const GeneratorClass = generators[type];
  if (!GeneratorClass) {
    throw new Error(`Unknown generator type: ${type}. Available: ${Object.keys(generators).join(', ')}`);
  }

  return new GeneratorClass(ROOT_DIR);
}

async function getAgent() {
  const { AIAgent } = await import('./agents/ai-agent.js');
  return new AIAgent(ROOT_DIR);
}

async function listTemplates(type) {
  const templatesPath = path.join(ROOT_DIR, '.generator', 'templates');
  const templates = [];

  if (!type || type === 'backend') {
    const backendTemplates = await loadTemplates(path.join(templatesPath, 'backend'));
    templates.push(...backendTemplates);
  }

  if (!type || type === 'frontend' || type === 'mfe') {
    const frontendTemplates = await loadTemplates(path.join(templatesPath, 'frontend'));
    templates.push(...frontendTemplates);
  }

  return templates;
}

async function loadTemplates(dir) {
  const templates = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const metaPath = path.join(dir, entry.name, 'template.json');
      try {
        const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
        templates.push({
          name: entry.name,
          type: meta.type,
          description: meta.description,
          path: path.join(dir, entry.name),
        });
      } catch {
        // Skip templates without metadata
      }
    }
  }

  return templates;
}

// ============================================================================
// PARSE AND RUN
// ============================================================================

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
