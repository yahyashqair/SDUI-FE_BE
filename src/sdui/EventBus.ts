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

    /**
     * Returns a scoped version of the event bus that automatically
     * prefixes all events with the given namespace.
     */
    scoped(namespace: string): EventBus {
        const bus = this;
        return {
            on: (event: string, handler: EventHandler) => bus.on(`${namespace}:${event}`, handler),
            emit: (event: string, data: any) => bus.emit(`${namespace}:${event}`, data),
            clear: () => {
                // Only clear events for this namespace? 
                // Or just don't allow clearing from scoped bus
                console.warn('[EventBus] clear() is not supported on scoped bus');
            },
            scoped: (sub: string) => bus.scoped(`${namespace}:${sub}`)
        } as any;
    }
}

export const globalEventBus = new EventBus();
