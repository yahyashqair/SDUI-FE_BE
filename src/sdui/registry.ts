/**
 * SDUI Component Registry
 *
 * Central registry that maps component type names to React components.
 * This enables dynamic rendering based on server-provided component definitions.
 */

import type { AnySDUIComponent, SDUIComponent, SDUIComponentRegistryItem } from './types';

/**
 * Component Registry Class
 *
 * Manages the mapping of component types to their implementations.
 * Supports dynamic registration and retrieval of components.
 */
export class SDUIComponentRegistry {
  private components: Map<string, SDUIComponentRegistryItem> = new Map();

  /**
   * Register a component
   */
  register(item: SDUIComponentRegistryItem): void {
    this.components.set(item.name, item);
  }

  /**
   * Register multiple components
   */
  registerBatch(items: SDUIComponentRegistryItem[]): void {
    items.forEach((item) => this.register(item));
  }

  /**
   * Get a component by type
   */
  get(type: string): SDUIComponentRegistryItem | undefined {
    return this.components.get(type);
  }

  /**
   * Check if a component type is registered
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all registered component types
   */
  getTypes(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    return this.components.delete(type);
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
  }

  /**
   * Get the count of registered components
   */
  get size(): number {
    return this.components.size;
  }
}

/**
 * Global registry instance
 */
export const globalRegistry = new SDUIComponentRegistry();

/**
 * Register component with global registry
 */
export function registerComponent(item: SDUIComponentRegistryItem): void {
  globalRegistry.register(item);
}

/**
 * Register multiple components with global registry
 */
export function registerComponents(items: SDUIComponentRegistryItem[]): void {
  globalRegistry.registerBatch(items);
}

/**
 * Get component from global registry
 */
export function getComponent(type: string): SDUIComponentRegistryItem | undefined {
  return globalRegistry.get(type);
}

/**
 * Check if component exists in global registry
 */
export function hasComponent(type: string): boolean {
  return globalRegistry.has(type);
}

/**
 * Get all registered component types
 */
export function getRegisteredTypes(): string[] {
  return globalRegistry.getTypes();
}

/**
 * Type guard to check if component is of specific type
 */
export function isComponentType<T extends AnySDUIComponent>(
  component: SDUIComponent,
  type: string
): component is T {
  return component.type === type;
}

/**
 * Get component props with defaults
 */
export function getComponentProps<T extends SDUIComponent>(
  component: T,
  defaults?: Partial<T>
): T {
  return defaults ? { ...defaults, ...component } : component;
}
