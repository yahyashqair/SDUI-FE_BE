import { FileSystem } from '../db/fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = util.promisify(exec);

export const executeFunction = async (projectId: string, entryPoint: string, params: any) => {
  const projectDir = FileSystem.getProjectDir(projectId);
  const scriptPath = path.join(projectDir, entryPoint);

  if (!fs.existsSync(scriptPath)) {
      return { error: `Function entry point ${entryPoint} not found` };
  }

  // Create a package.json in the project to force CommonJS if not present
  // This solves the issue where root package.json type: module forces .js files to be ESM
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

  const runnerPath = path.join(projectDir, `__runner_${Date.now()}.cjs`);
  fs.writeFileSync(runnerPath, runnerCode);

  try {
      // Run in a separate process
      const { stdout, stderr } = await execAsync(`node ${runnerPath}`, {
          cwd: projectDir,
          env: { ...process.env, PROJECT_ID: projectId } // Pass context via ENV
      });

      try {
          // cleanup
          fs.unlinkSync(runnerPath);
          return JSON.parse(stdout.trim());
      } catch (e) {
          return { result: stdout.trim(), log: stderr };
      }
  } catch (e: any) {
      try { fs.unlinkSync(runnerPath); } catch {}
      return { error: e.message, stderr: e.stderr };
  }
};
