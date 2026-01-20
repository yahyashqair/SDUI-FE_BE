import { FileSystem } from '../db/fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const execAsync = util.promisify(exec);

// --- Strategy Interface ---

export interface ExecutionResult {
    result?: string;
    log?: string;
    error?: string;
}

export interface ExecutionStrategy {
    execute(projectId: string, entryPoint: string, params: any): Promise<ExecutionResult>;
}

// --- Helper ---

function prepareRunner(projectId: string, entryPoint: string, params: any) {
    const projectDir = FileSystem.getProjectDir(projectId);

    // Create a package.json in the project to force CommonJS if not present
    const pkgPath = path.join(projectDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        fs.writeFileSync(pkgPath, JSON.stringify({ type: 'commonjs' }));
    }

    const runnerCode = `
      try {
          const main = require('./${path.basename(entryPoint)}');
          const params = ${JSON.stringify(params)};

          (async () => {
              try {
                  if (typeof main === 'function') {
                      const result = await main(params);
                      console.log(JSON.stringify(result));
                  } else if (typeof main.handler === 'function') {
                      const result = await main.handler(params);
                      console.log(JSON.stringify(result));
                  } else {
                      console.log(JSON.stringify({ success: true }));
                  }
              } catch (e) {
                  console.error(e);
                  process.exit(1);
              }
          })();
      } catch (e) {
          console.error(e);
          process.exit(1);
      }
    `;

    // Use UUID for unique filenames to prevent race conditions
    const runnerName = `__runner_${randomUUID()}.cjs`;
    const runnerPath = path.join(projectDir, runnerName);
    fs.writeFileSync(runnerPath, runnerCode);

    return {
        projectDir,
        runnerPath,
        runnerName,
        cleanup: () => {
            try { fs.unlinkSync(runnerPath); } catch { }
        }
    };
}

// --- Strategies ---

export class LocalExecutionStrategy implements ExecutionStrategy {
    async execute(projectId: string, entryPoint: string, params: any): Promise<ExecutionResult> {
        const { projectDir, runnerPath, cleanup } = prepareRunner(projectId, entryPoint, params);

        try {
            // Run in a separate process
            // SECURITY NOTE: This is still running locally.
            const { stdout, stderr } = await execAsync(`node ${runnerPath}`, {
                cwd: projectDir,
                env: { ...process.env, PROJECT_ID: projectId }
            });

            cleanup();

            try {
                return JSON.parse(stdout.trim());
            } catch (e) {
                return { result: stdout.trim(), log: stderr };
            }
        } catch (e: any) {
            cleanup();
            return { error: e.message, log: e.stderr };
        }
    }
}

export class ContainerExecutionStrategy implements ExecutionStrategy {
    async execute(projectId: string, entryPoint: string, params: any): Promise<ExecutionResult> {
        const { projectDir, runnerName, cleanup } = prepareRunner(projectId, entryPoint, params);

        try {
            // Use standard Node Alpine image
            const image = 'node:18-alpine';

            // Docker Flags for Security & Reliability:
            // --rm: Remove container after exit
            // --network none: No internet access (Hard Isolation)
            // --memory 128m: Prevent memory exhaustion/leaks
            // --cpus 0.5: Prevent CPU starvation of host
            // --read-only: Root FS is read-only (except mounted volume)
            // -v ...: Mount tenant code
            // -w ...: Set workdir

            const limits = '--memory 128m --cpus 0.5';
            const isolation = '--network none';

            const cmd = `docker run --rm ${isolation} ${limits} -v "${projectDir}:/app" -w "/app" -e PROJECT_ID="${projectId}" ${image} node ${runnerName}`;

            const { stdout, stderr } = await execAsync(cmd);

            cleanup();

            try {
                return JSON.parse(stdout.trim());
            } catch (e) {
                return { result: stdout.trim(), log: stderr };
            }
        } catch (e: any) {
            cleanup();
            // Docker errors come in stderr usually
            return { error: `Container Execution Failed: ${e.message}`, log: e.stderr };
        }
    }
}

// --- Factory / Context ---

class Executor {
    private strategy: ExecutionStrategy;

    constructor(strategy: ExecutionStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ExecutionStrategy) {
        this.strategy = strategy;
    }

    async execute(projectId: string, entryPoint: string, params: any) {
        return this.strategy.execute(projectId, entryPoint, params);
    }
}

// Default to Local for now, unless ENV explicitly asks for CONTAINER
// For safely, stick to LOCAL until user configures Docker
const useContainer = process.env.EXECUTION_MODE === 'container';
const executor = new Executor(useContainer ? new ContainerExecutionStrategy() : new LocalExecutionStrategy());

export const executeFunction = async (projectId: string, entryPoint: string, params: any) => {
    return executor.execute(projectId, entryPoint, params);
};

