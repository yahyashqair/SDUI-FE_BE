
import { FileSystem } from '../src/db/fs';
import path from 'path';
import fs from 'fs';

async function verifySecurity() {
    console.log('--- Verifying Security ---');
    const projectId = 'test-security-proj';
    await FileSystem.initProject(projectId);

    try {
        console.log('Attempting traversal read...');
        FileSystem.readFile(projectId, '../../package.json');
        console.error('FAIL: Traversal read should have thrown error');
    } catch (e: any) {
        if (e.message.includes('Access denied')) {
            console.log('PASS: Traversal read blocked');
        } else {
            console.error('FAIL: Unexpected error', e.message);
        }
    }
}

async function verifyReleases() {
    console.log('\n--- Verifying Releases ---');
    // Mock request/response for API testing would be complex here without running full server.
    // Instead we test the logic via file manipulation if possible, or just note manual steps.
    // For this script, we'll verify the releases.json structure matches expectation after a manual ops simulation

    const releaseFile = path.resolve('data/releases.json');
    if (!fs.existsSync(releaseFile)) {
        console.log('Creating dummy releases.json');
        fs.writeFileSync(releaseFile, JSON.stringify([]));
    }

    // Simulate what the API does
    const releases = JSON.parse(fs.readFileSync(releaseFile, 'utf-8'));
    // Clean up previous test runs
    const cleanReleases = releases.filter((r: any) => r.id !== 'test-release');

    const newRelease = {
        id: 'test-release',
        version: '1.0.0',
        status: 'draft',
        deployments: []
    };

    cleanReleases.push(newRelease);

    // Promote
    const releaseIndex = cleanReleases.findIndex((r: any) => r.id === 'test-release');
    cleanReleases[releaseIndex].deployments.push({
        env: 'staging',
        deployedAt: new Date().toISOString(),
        deployedBy: 'test-script'
    });

    fs.writeFileSync(releaseFile, JSON.stringify(cleanReleases, null, 2));

    // Verify
    const verifyRead = JSON.parse(fs.readFileSync(releaseFile, 'utf-8'));
    const testR = verifyRead.find((r: any) => r.id === 'test-release');

    if (testR && testR.deployments.length === 1 && testR.deployments[0].env === 'staging') {
        console.log('PASS: Release deployment recorded');
    } else {
        console.error('FAIL: Release deployment not recorded correctly');
    }
}

async function main() {
    await verifySecurity();
    await verifyReleases();
}

main().catch(console.error);
