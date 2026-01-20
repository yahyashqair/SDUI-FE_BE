
import { executeFunction } from '../src/platform/executor.ts';
import { FileSystem } from '../src/db/fs.ts';
import path from 'path';

async function runLoadTest() {
    console.log("🚀 Starting Load & Resilience Test...");

    const projectId = 'load-test-proj';
    await FileSystem.initProject(projectId);

    const entryPoint = 'heavy.js';
    const code = `
        module.exports = async (params) => {
            // Simulate work
            let sum = 0;
            for(let i=0; i<params.iterations; i++) sum += i;
            return { sum, pid: process.pid };
        };
    `;

    await FileSystem.writeFile(projectId, entryPoint, code);

    console.log("📦 Running 10 concurrent executions...");

    const startTime = Date.now();
    const promises = Array.from({ length: 10 }).map((_, i) =>
        executeFunction(projectId, entryPoint, { iterations: 1000000 })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`⏱️ Finished in ${duration}ms`);

    const successCount = results.filter(r => !r.error).length;
    console.log(`✅ Success: ${successCount}/10`);

    if (successCount === 10) {
        console.log("💎 Concurrency looks stable!");
    } else {
        console.error("❌ Some executions failed!");
        results.forEach((r, i) => {
            if (r.error) console.error(`[${i}] Error: ${r.error}`);
        });
    }
}

runLoadTest().catch(console.error);
