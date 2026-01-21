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
 * Sanitize CLI arguments to prevent command injection
 * Only allows alphanumeric characters, dots, hyphens, underscores, and forward slashes
 */
function sanitizeArg(arg: string, argName: string): string {
    if (typeof arg !== 'string') {
        throw new Error(`Invalid ${argName}: must be a string`);
    }
    if (arg.length === 0) {
        throw new Error(`Invalid ${argName}: cannot be empty`);
    }
    if (arg.length > 256) {
        throw new Error(`Invalid ${argName}: too long (max 256 characters)`);
    }
    // Allow alphanumeric, dots, hyphens, underscores, and forward slashes (for paths)
    if (!/^[a-zA-Z0-9._/-]+$/.test(arg)) {
        throw new Error(`Invalid ${argName}: contains disallowed characters. Only alphanumeric, dots, hyphens, underscores, and forward slashes are allowed.`);
    }
    // Prevent path traversal
    if (arg.includes('..')) {
        throw new Error(`Invalid ${argName}: path traversal not allowed`);
    }
    return arg;
}

/**
 * Sanitize HTTP method
 */
function sanitizeMethod(method: string): string {
    const allowed = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const normalized = method.toUpperCase();
    if (!allowed.includes(normalized)) {
        throw new Error(`Invalid HTTP method: ${method}. Allowed: ${allowed.join(', ')}`);
    }
    return normalized;
}

/**
 * Sanitize URL path
 */
function sanitizeUrl(url: string): string {
    if (!url.startsWith('/')) {
        throw new Error('URL must start with /');
    }
    if (!/^[a-zA-Z0-9/_.-]+$/.test(url)) {
        throw new Error('URL contains invalid characters');
    }
    return url;
}

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
    const safeName = sanitizeArg(name, 'name');
    const safeEnv = sanitizeArg(env, 'env');
    const safeCodePath = sanitizeArg(codePath, 'codePath');
    const safeNamespace = sanitizeArg(namespace, 'namespace');
    
    return fissionExec(
        `function create --name ${safeName} --env ${safeEnv} --code ${safeCodePath} --namespace ${safeNamespace}`
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
    const safeName = sanitizeArg(name, 'name');
    const safeCodePath = sanitizeArg(codePath, 'codePath');
    const safeNamespace = sanitizeArg(namespace, 'namespace');
    
    return fissionExec(
        `function update --name ${safeName} --code ${safeCodePath} --namespace ${safeNamespace}`
    );
}

/**
 * Delete a function
 */
export async function deleteFunction(name: string, namespace = 'default'): Promise<string> {
    const safeName = sanitizeArg(name, 'name');
    const safeNamespace = sanitizeArg(namespace, 'namespace');
    return fissionExec(`function delete --name ${safeName} --namespace ${safeNamespace}`);
}

/**
 * Get function logs
 */
export async function getFunctionLogs(name: string, namespace = 'default'): Promise<string> {
    const safeName = sanitizeArg(name, 'name');
    const safeNamespace = sanitizeArg(namespace, 'namespace');
    return fissionExec(`function logs --name ${safeName} --namespace ${safeNamespace}`);
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
    const safeName = sanitizeArg(name, 'name');
    const safeMethod = sanitizeMethod(method);
    const safeNamespace = sanitizeArg(namespace, 'namespace');
    
    let cmd = `function test --name ${safeName} --method ${safeMethod} --namespace ${safeNamespace}`;
    if (body) {
        // Safely escape body for shell - use base64 encoding to prevent injection
        const safeBody = Buffer.from(body).toString('base64');
        cmd += ` --body "$(echo ${safeBody} | base64 -d)"`;
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
    const safeName = sanitizeArg(name, 'name');
    const safeImage = sanitizeArg(image, 'image');
    return fissionExec(`env create --name ${safeName} --image ${safeImage}`);
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
    const safeName = sanitizeArg(name, 'name');
    const safeMethod = sanitizeMethod(method);
    const safeUrl = sanitizeUrl(url);
    const safeFunctionName = sanitizeArg(functionName, 'functionName');
    
    return fissionExec(
        `route create --name ${safeName} --method ${safeMethod} --url ${safeUrl} --function ${safeFunctionName}`
    );
}

/**
 * Delete route
 */
export async function deleteRoute(name: string): Promise<string> {
    const safeName = sanitizeArg(name, 'name');
    return fissionExec(`route delete --name ${safeName}`);
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
