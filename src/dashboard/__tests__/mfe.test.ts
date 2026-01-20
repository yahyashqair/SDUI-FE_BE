
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import mfeManager from '../lib/mfe-manager';
import fs from 'fs/promises';

vi.mock('fs/promises', () => {
    const mock = {
        readFile: vi.fn(),
        writeFile: vi.fn(),
    };
    return {
        ...mock,
        default: mock
    };
});

describe('MFE Manager', () => {
    const mockRegistry = {
        mfes: {} as Record<string, any>,
        generatedAt: new Date().toISOString()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default empty registry
        vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockRegistry));
        // Mock file stats/read for integrity check
        vi.mocked(fs.readFile).mockImplementation(((path: string) => {
            if (path.endsWith('registry.json')) return JSON.stringify(mockRegistry);
            return 'file content';
        }) as any);
    });

    it('should register a new MFE', async () => {
        await mfeManager.registerMFE('test-mfe', 'src/mfes/test.js', {
            version: '1.0.0',
            encapsulation: 'shadow',
            dependencies: { 'react': '18.2.0' }
        });

        const saveCall = vi.mocked(fs.writeFile).mock.calls[0];
        const savedRegistry = JSON.parse(saveCall[1] as string);

        expect(savedRegistry.mfes['test-mfe']).toBeDefined();
        expect(savedRegistry.mfes['test-mfe'].version).toBe('1.0.0');
        expect(savedRegistry.mfes['test-mfe'].encapsulation).toBe('shadow');
        expect(savedRegistry.mfes['test-mfe'].dependencies).toEqual({ 'react': '18.2.0' });
    });

    it('should bump version correctly', async () => {
        // Setup registry with existing MFE
        mockRegistry.mfes = {
            'test-mfe': { version: '1.0.0', source: 'foo.js' }
        };

        await mfeManager.bumpVersion('test-mfe', 'minor');

        const saveCall = vi.mocked(fs.writeFile).mock.calls[0];
        const savedRegistry = JSON.parse(saveCall[1] as string);

        expect(savedRegistry.mfes['test-mfe'].version).toBe('1.1.0');
    });
});
