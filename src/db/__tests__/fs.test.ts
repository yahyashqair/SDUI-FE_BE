
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FileSystem } from '../fs';
import fs from 'fs';
import path from 'path';

const tenantsDir = path.resolve(process.cwd(), 'data', 'tenants');

// Improved mock factory for fs
vi.mock('fs', () => {
    const mock = {
        existsSync: vi.fn(() => true),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(),
        unlinkSync: vi.fn(),
        readdirSync: vi.fn(),
        realpathSync: vi.fn((p: string) => p), // Return path as-is for mocking
    };
    return {
        ...mock,
        default: mock
    };
});

vi.mock('child_process', () => {
    const mock = {
        exec: vi.fn((cmd, opts, cb) => {
            const callback = typeof opts === 'function' ? opts : cb;
            if (callback) callback(null, { stdout: '', stderr: '' });
        }),
    };
    return {
        ...mock,
        default: mock
    };
});

describe('FileSystem', () => {
    const mockProjectId = 'test-project-123';
    const projectDir = path.join(tenantsDir, mockProjectId);

    beforeEach(() => {
        vi.clearAllMocks();
        // Default existsSync to false for project-specific checks
        vi.mocked(fs.existsSync).mockReturnValue(false);
        // Setup realpathSync to return path as-is (no symlinks)
        vi.mocked(fs.realpathSync).mockImplementation((p: fs.PathLike) => p.toString());
    });

    it('should initialize a project directory structure', async () => {
        await FileSystem.initProject(mockProjectId);

        // Should create project dir, src, lib
        // Implementation uses recursive: true, so it might call it for src which creates root too.
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining(projectDir), { recursive: true });

        // Should create db helper
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            path.join(projectDir, 'src', 'lib', 'db.js'),
            expect.stringContaining('better-sqlite3')
        );
    });

    it('should write and read files correctly', async () => {
        // Setup mock so it needs to create the directory
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.readFileSync).mockReturnValue('file content' as any);

        const filePath = 'components/Button.js';

        // WRITE
        await FileSystem.writeFile(mockProjectId, filePath, 'file content');
        const expectedPath = path.join(projectDir, 'src', filePath);

        expect(fs.mkdirSync).toHaveBeenCalledWith(path.dirname(expectedPath), { recursive: true });
        expect(fs.writeFileSync).toHaveBeenCalledWith(expectedPath, 'file content');

        // READ Pass exists check
        vi.mocked(fs.existsSync).mockReturnValue(true);
        const content = FileSystem.readFile(mockProjectId, filePath);
        expect(content).toBe('file content');
        expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf-8');
    });

    it('should block path traversal', () => {
        expect(() => {
            FileSystem.readFile(mockProjectId, '../../etc/passwd');
        }).toThrow('Access denied');
    });
});
