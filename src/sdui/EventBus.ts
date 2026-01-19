/**
 * Simple Event Bus for Inter-MFE Communication
 */

type EventHandler<T = any> = (data: T) => void;

export class EventBus {
    private listeners: Record<string, EventHandler[]> = {};

    on<T = any>(event: string, handler: EventHandler<T>): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);

        // Return unsubscribe function
        return () => {
            this.listeners[event] = this.listeners[event].filter(h => h !== handler);
        };
    }

    emit<T = any>(event: string, data: T) {
        const handlers = this.listeners[event] || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error(`[EventBus] Error in handler for event "${event}":`, e);
            }
        });
    }

    clear() {
        this.listeners = {};
    }
}

export const globalEventBus = new EventBus();
