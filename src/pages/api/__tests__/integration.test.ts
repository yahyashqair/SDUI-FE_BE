import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as EngineerEndpoint } from '../agent/engineer';
import { ALL as MasterAPI } from '../master';
import fs from 'fs';

// Mock the AI agent module to avoid actual API calls
vi.mock('../../../ai/agent', () => ({
    EngineerAgent: {
        process: vi.fn().mockResolvedValue({
            success: true,
            results: [{ tool: 'test', success: true }]
        })
    }
}));

vi.mock('fs', () => {
    const mock = {
        existsSync: vi.fn(() => true),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(),
        unlinkSync: vi.fn(),
        mkdirSync: vi.fn(),
    };
    return {
        ...mock,
        default: mock
    };
});

describe('API Integration', () => {
    beforeEach(() => {
        vi.stubEnv('AI_API_KEY', 'test-key');
        vi.clearAllMocks();
    });

    describe('AI Agent (engineer)', () => {
        it('should require projectId and instructions', async () => {
            const req = new Request('http://localhost/api/agent/engineer', {
                method: 'POST',
                body: JSON.stringify({ prompt: 'make a button' }) // missing projectId
            });

            const res = await EngineerEndpoint({ request: req } as any);
            expect(res.status).toBe(400);
            
            const body = await res.json();
            expect(body.error).toContain('projectId');
        });

        it('should process valid requests', async () => {
            const req = new Request('http://localhost/api/agent/engineer', {
                method: 'POST',
                body: JSON.stringify({ 
                    projectId: 'test-project',
                    instructions: 'create a button component'
                })
            });

            const res = await EngineerEndpoint({ request: req } as any);
            expect(res.status).toBe(200);
            
            const body = await res.json();
            expect(body.success).toBe(true);
        });
    });

    describe('Release Management (master)', () => {
        it('should promote a release to staging', async () => {
            const mockReleases = [{ id: 'rel-1', status: 'draft', deployments: [] }];
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockReleases));

            const req = new Request('http://localhost/api/master?resource=releases&action=promote', {
                method: 'POST',
                body: JSON.stringify({ releaseId: 'rel-1', env: 'staging' })
            });

            await MasterAPI({ request: req } as any);

            // Verify file write
            const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
            const updatedReleases = JSON.parse(writeCall[1] as string);

            expect(updatedReleases[0].deployments).toHaveLength(1);
            expect(updatedReleases[0].deployments[0].env).toBe('staging');
        });

        it('should reject invalid environment', async () => {
            const req = new Request('http://localhost/api/master?resource=releases&action=promote', {
                method: 'POST',
                body: JSON.stringify({ releaseId: 'rel-1', env: 'invalid-env' })
            });

            const res = await MasterAPI({ request: req } as any);
            expect(res.status).toBe(400);
        });
    });

});
