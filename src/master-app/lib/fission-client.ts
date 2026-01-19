/**
 * Fission Client - Wrapper for Fission CLI/API
 * Provides programmatic access to manage Fission functions
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FissionFunction {
    name: string;
    env: string;
    executorType: string;
    namespace: string;
}

export interface FissionEnv {
    name: string;
    image: string;
    namespace: string;
}

export interface FissionRoute {
    name: string;
    method: string;
    url: string;
    function: string;
}

const FISSION_CLI = process.env.FISSION_CLI || 'fission';

/**
 * Execute fission CLI command
 */
async function fissionExec(args: string): Promise<string> {
    try {
        const { stdout } = await execAsync(`${FISSION_CLI} ${args}`);
        return stdout.trim();
    } catch (error: any) {
        throw new Error(`Fission CLI error: ${error.stderr || error.message}`);
    }
}

/**
 * List all functions
 */
export async function listFunctions(): Promise<FissionFunction[]> {
    const output = await fissionExec('function list -o json');
    try {
        return JSON.parse(output) || [];
    } catch {
        // Parse text output if JSON fails
        const lines = output.split('\n').slice(1); // Skip header
        return lines.filter(l => l.trim()).map(line => {
            const parts = line.split(/\s+/);
            return {
                name: parts[0],
                env: parts[1],
                executorType: parts[2],
                namespace: parts[parts.length - 1]
            };
        });
    }
}

/**
 * Create a new function
 */
export async function createFunction(
    name: string,
    env: string,
    codePath: string,
    namespace = 'default'
): Promise<string> {
    return fissionExec(
        `function create --name ${name} --env ${env} --code ${codePath} --namespace ${namespace}`
    );
}

/**
 * Update function code
 */
export async function updateFunction(
    name: string,
    codePath: string,
    namespace = 'default'
): Promise<string> {
    return fissionExec(
        `function update --name ${name} --code ${codePath} --namespace ${namespace}`
    );
}

/**
 * Delete a function
 */
export async function deleteFunction(name: string, namespace = 'default'): Promise<string> {
    return fissionExec(`function delete --name ${name} --namespace ${namespace}`);
}

/**
 * Get function logs
 */
export async function getFunctionLogs(name: string, namespace = 'default'): Promise<string> {
    return fissionExec(`function logs --name ${name} --namespace ${namespace}`);
}

/**
 * Test a function
 */
export async function testFunction(
    name: string,
    method = 'GET',
    body?: string,
    namespace = 'default'
): Promise<string> {
    let cmd = `function test --name ${name} --method ${method} --namespace ${namespace}`;
    if (body) {
        cmd += ` --body '${body}'`;
    }
    return fissionExec(cmd);
}

/**
 * List environments
 */
export async function listEnvs(): Promise<FissionEnv[]> {
    const output = await fissionExec('env list');
    const lines = output.split('\n').slice(1);
    return lines.filter(l => l.trim()).map(line => {
        const parts = line.split(/\s+/);
        return {
            name: parts[0],
            image: parts[1],
            namespace: parts[parts.length - 1]
        };
    });
}

/**
 * Create environment
 */
export async function createEnv(name: string, image: string): Promise<string> {
    return fissionExec(`env create --name ${name} --image ${image}`);
}

/**
 * List routes
 */
export async function listRoutes(): Promise<FissionRoute[]> {
    const output = await fissionExec('route list');
    const lines = output.split('\n').slice(1);
    return lines.filter(l => l.trim()).map(line => {
        const parts = line.split(/\s+/);
        return {
            name: parts[0],
            method: parts[1],
            url: parts[2],
            function: parts[3]
        };
    });
}

/**
 * Create route
 */
export async function createRoute(
    name: string,
    method: string,
    url: string,
    functionName: string
): Promise<string> {
    return fissionExec(
        `route create --name ${name} --method ${method} --url ${url} --function ${functionName}`
    );
}

/**
 * Delete route
 */
export async function deleteRoute(name: string): Promise<string> {
    return fissionExec(`route delete --name ${name}`);
}

export default {
    listFunctions,
    createFunction,
    updateFunction,
    deleteFunction,
    getFunctionLogs,
    testFunction,
    listEnvs,
    createEnv,
    listRoutes,
    createRoute,
    deleteRoute
};
