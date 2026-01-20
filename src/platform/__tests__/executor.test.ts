
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { LocalExecutionStrategy, ContainerExecutionStrategy } from '../executor';
import { FileSystem } from '../../db/fs';
import fs from 'fs';
import { exec } from 'child_process';

// Mock dependencies
vi.mock('../../db/fs');
vi.mock('fs', () => {
    const mock = {
        existsSync: vi.fn(() => true),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
        mkdirSync: vi.fn(),
    };
    return {
        ...mock,
        default: mock
    };
});
vi.mock('child_process', () => {
    const mock = {
        exec: vi.fn(),
    };
    return {
        ...mock,
        default: mock
    };
});

describe('Executor Strategies', () => {
    const mockProjectId = 'test-proj';
    const mockEntryPoint = 'index.js';
    const mockParams = { foo: 'bar' };
    const projectDir = '/tmp/test-proj/src';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(FileSystem.getProjectDir).mockReturnValue(projectDir);
        vi.mocked(fs.existsSync).mockReturnValue(true);
    });

    describe('LocalExecutionStrategy', () => {
        it('should execute node command locally', async () => {
            const strategy = new LocalExecutionStrategy();

            // Mock exec
            vi.mocked(exec).mockImplementation(((cmd: string, opts: any, cb: any) => {
                cb(null, { stdout: '{"success":true}', stderr: '' });
            }) as any);

            const result = await strategy.execute(mockProjectId, mockEntryPoint, mockParams);

            expect(result).toEqual({ success: true });
            const execMock = vi.mocked(exec);
            const execCall = execMock.mock.calls[0];
            expect(execCall[0]).toContain('node');
            expect(execCall[0]).toContain('.cjs');
            if (execCall[1]) {
                expect(execCall[1].cwd).toBe(projectDir);
            }
        });
    });

    describe('ContainerExecutionStrategy', () => {
        it('should execute docker run with correct flags', async () => {
            const strategy = new ContainerExecutionStrategy();

            // Mock exec
            vi.mocked(exec).mockImplementation(((cmd: string, opts: any, cb: any) => {
                cb(null, { stdout: '{"success":true}', stderr: '' });
            }) as any);

            await strategy.execute(mockProjectId, mockEntryPoint, mockParams);

            const execCall = vi.mocked(exec).mock.calls[0];
            const cmd = execCall[0];

            // Verify Flags
            expect(cmd).toContain('docker run');
            expect(cmd).toContain('--rm'); // Ephemeral
            expect(cmd).toContain('--network none'); // Isolation
            expect(cmd).toContain('--memory 128m'); // Limits
            expect(cmd).toContain('--cpus 0.5'); // Limits
            expect(cmd).toContain(`-e PROJECT_ID="${mockProjectId}"`);
            expect(cmd).toContain('node:18-alpine');
        });
    });
});
