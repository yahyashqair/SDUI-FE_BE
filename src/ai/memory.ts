/**
 * AI Agent Memory System
 * Provides persistent context and learning for AI agents
 */

import type { AgentType, MemoryEntry } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const MAX_ENTRIES_PER_PROJECT = 100;
const MEMORY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Memory Class
// ============================================================================

export class AgentMemory {
    private memories: Map<string, MemoryEntry[]> = new Map();

    /**
     * Save a memory entry
     */
    save(projectId: string, entry: Omit<MemoryEntry, 'timestamp'>): MemoryEntry {
        const fullEntry: MemoryEntry = {
            ...entry,
            timestamp: Date.now()
        };

        const key = projectId;
        if (!this.memories.has(key)) {
            this.memories.set(key, []);
        }

        const entries = this.memories.get(key)!;
        entries.push(fullEntry);

        // Trim to max entries
        if (entries.length > MAX_ENTRIES_PER_PROJECT) {
            entries.splice(0, entries.length - MAX_ENTRIES_PER_PROJECT);
        }

        return fullEntry;
    }

    /**
     * Get recent memory entries for a project
     */
    getRecent(projectId: string, limit: number = 10): MemoryEntry[] {
        const entries = this.memories.get(projectId) || [];
        return entries.slice(-limit);
    }

    /**
     * Get all entries for a project
     */
    getAll(projectId: string): MemoryEntry[] {
        return this.memories.get(projectId) || [];
    }

    /**
     * Get entries by agent type
     */
    getByAgent(projectId: string, agentType: AgentType): MemoryEntry[] {
        const entries = this.memories.get(projectId) || [];
        return entries.filter(e => e.agentType === agentType);
    }

    /**
     * Get entries by action
     */
    getByAction(projectId: string, action: string): MemoryEntry[] {
        const entries = this.memories.get(projectId) || [];
        return entries.filter(e => e.action === action);
    }

    /**
     * Build context string from recent entries
     */
    getContext(projectId: string, options: {
        limit?: number;
        agentType?: AgentType;
        includeResults?: boolean;
    } = {}): string {
        const { limit = 20, agentType, includeResults = false } = options;
        
        let entries = this.getRecent(projectId, limit);
        
        if (agentType) {
            entries = entries.filter(e => e.agentType === agentType);
        }

        return entries.map(e => {
            const date = new Date(e.timestamp).toISOString();
            let line = `[${date}] ${e.agentType}: ${e.action}`;
            
            if (includeResults && e.result) {
                const resultStr = typeof e.result === 'string' 
                    ? e.result 
                    : JSON.stringify(e.result).substring(0, 100);
                line += ` -> ${resultStr}`;
            }
            
            return line;
        }).join('\n');
    }

    /**
     * Search memories by context content
     */
    search(projectId: string, query: string): MemoryEntry[] {
        const entries = this.memories.get(projectId) || [];
        const queryLower = query.toLowerCase();
        
        return entries.filter(e => {
            const contextStr = JSON.stringify(e.context).toLowerCase();
            const actionStr = e.action.toLowerCase();
            return contextStr.includes(queryLower) || actionStr.includes(queryLower);
        });
    }

    /**
     * Get summary of project activity
     */
    getSummary(projectId: string): {
        totalEntries: number;
        byAgent: Record<string, number>;
        recentActions: string[];
        firstEntry?: number;
        lastEntry?: number;
    } {
        const entries = this.memories.get(projectId) || [];
        
        const byAgent: Record<string, number> = {};
        for (const entry of entries) {
            byAgent[entry.agentType] = (byAgent[entry.agentType] || 0) + 1;
        }

        const recentActions = entries.slice(-5).map(e => e.action);

        return {
            totalEntries: entries.length,
            byAgent,
            recentActions,
            firstEntry: entries[0]?.timestamp,
            lastEntry: entries[entries.length - 1]?.timestamp
        };
    }

    /**
     * Clear all memories for a project
     */
    clear(projectId: string): void {
        this.memories.delete(projectId);
    }

    /**
     * Clear expired memories across all projects
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [projectId, entries] of this.memories.entries()) {
            const validEntries = entries.filter(
                e => now - e.timestamp < MEMORY_EXPIRY_MS
            );
            
            cleaned += entries.length - validEntries.length;
            
            if (validEntries.length === 0) {
                this.memories.delete(projectId);
            } else {
                this.memories.set(projectId, validEntries);
            }
        }

        return cleaned;
    }

    /**
     * Export memories for persistence
     */
    export(projectId: string): string {
        const entries = this.memories.get(projectId) || [];
        return JSON.stringify(entries);
    }

    /**
     * Import memories from persistence
     */
    import(projectId: string, data: string): void {
        try {
            const entries = JSON.parse(data) as MemoryEntry[];
            this.memories.set(projectId, entries);
        } catch (e) {
            console.error('Failed to import memories:', e);
        }
    }

    /**
     * Get statistics across all projects
     */
    getStats(): {
        projectCount: number;
        totalEntries: number;
        memorySize: number;
    } {
        let totalEntries = 0;
        let memorySize = 0;

        for (const entries of this.memories.values()) {
            totalEntries += entries.length;
            memorySize += JSON.stringify(entries).length;
        }

        return {
            projectCount: this.memories.size,
            totalEntries,
            memorySize
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const agentMemory = new AgentMemory();

// Schedule periodic cleanup
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const cleaned = agentMemory.cleanup();
        if (cleaned > 0) {
            console.log(`[Memory] Cleaned up ${cleaned} expired entries`);
        }
    }, 60 * 60 * 1000); // Every hour
}
