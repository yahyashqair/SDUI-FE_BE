
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { POST as AgentGenerate } from '../agent/generate';
import { ALL as MasterAPI } from '../master';
import { FileSystem } from '../../../db/fs';
import fs from 'fs';

vi.mock('../../../db/fs');
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

global.fetch = vi.fn();

describe('API Integration', () => {
    beforeEach(() => {
        vi.stubEnv('OPENAI_API_KEY', 'test-key');
    });
    describe('AI Agent (generate)', () => {
        it('should inject project context into prompt', async () => {
            // Mock FileSystem finding files
            vi.mocked(FileSystem.listFiles).mockReturnValue([
                { path: 'src/App.js', type: 'file' }
            ] as any);
            vi.mocked(FileSystem.readFile).mockReturnValue('{"dependencies":{"react":"18"}}');

            const req = new Request('http://localhost/api/agent/generate', {
                method: 'POST',
                body: JSON.stringify({ prompt: 'make a button', projectId: 'proj-1' })
            });

            // Mock OpenAI response
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                body: { getReader: () => undefined } // simplified stream mock
            } as any);

            await AgentGenerate({ request: req } as any);

            // Verify fetch payload
            const fetchCall = vi.mocked(global.fetch).mock.calls[0];
            const body = JSON.parse(fetchCall[1]?.body as string);

            // Check if system prompt contains context
            const systemMsg = body.messages[0].content;
            expect(systemMsg).toContain('PROJECT CONTEXT');
            expect(systemMsg).toContain('src/App.js');
            expect(systemMsg).toContain('react');
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
