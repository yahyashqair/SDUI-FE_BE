/**
 * SDUI Registry Tests
 *
 * Unit tests for the component registry system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SDUIComponentRegistry,
  registerComponent,
  registerComponents,
  getComponent,
  hasComponent,
  getRegisteredTypes,
  isComponentType,
  globalRegistry,
} from '../registry';
import type { SDUIComponent } from '../types';

// Mock component for testing
const MockComponent = () => null;

describe('SDUIComponentRegistry', () => {
  let registry: SDUIComponentRegistry;

  beforeEach(() => {
    registry = new SDUIComponentRegistry();
  });

  describe('register', () => {
    it('should register a component', () => {
      registry.register({
        name: 'TestComponent',
        component: MockComponent,
      });

      expect(registry.size).toBe(1);
      expect(registry.has('TestComponent')).toBe(true);
    });

    it('should allow overwriting existing components', () => {
      registry.register({
        name: 'TestComponent',
        component: MockComponent,
      });

      const AnotherComponent = () => null;
      registry.register({
        name: 'TestComponent',
        component: AnotherComponent,
      });

      expect(registry.size).toBe(1);
      expect(registry.get('TestComponent')?.component).toBe(AnotherComponent);
    });
  });

  describe('registerBatch', () => {
    it('should register multiple components', () => {
      registry.registerBatch([
        { name: 'Component1', component: MockComponent },
        { name: 'Component2', component: MockComponent },
        { name: 'Component3', component: MockComponent },
      ]);

      expect(registry.size).toBe(3);
      expect(registry.has('Component1')).toBe(true);
      expect(registry.has('Component2')).toBe(true);
      expect(registry.has('Component3')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return registered component', () => {
      const item = {
        name: 'TestComponent',
        component: MockComponent,
      };
      registry.register(item);

      expect(registry.get('TestComponent')).toEqual(item);
    });

    it('should return undefined for unknown component', () => {
      expect(registry.get('Unknown')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered component', () => {
      registry.register({
        name: 'TestComponent',
        component: MockComponent,
      });

      expect(registry.has('TestComponent')).toBe(true);
    });

    it('should return false for unknown component', () => {
      expect(registry.has('Unknown')).toBe(false);
    });
  });

  describe('getTypes', () => {
    it('should return array of registered component types', () => {
      registry.registerBatch([
        { name: 'Component1', component: MockComponent },
        { name: 'Component2', component: MockComponent },
        { name: 'Component3', component: MockComponent },
      ]);

      const types = registry.getTypes();
      expect(types).toHaveLength(3);
      expect(types).toContain('Component1');
      expect(types).toContain('Component2');
      expect(types).toContain('Component3');
    });

    it('should return empty array when no components registered', () => {
      expect(registry.getTypes()).toEqual([]);
    });
  });

  describe('unregister', () => {
    it('should remove registered component', () => {
      registry.register({
        name: 'TestComponent',
        component: MockComponent,
      });

      expect(registry.has('TestComponent')).toBe(true);
      expect(registry.unregister('TestComponent')).toBe(true);
      expect(registry.has('TestComponent')).toBe(false);
    });

    it('should return false when unregistering unknown component', () => {
      expect(registry.unregister('Unknown')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all registered components', () => {
      registry.registerBatch([
        { name: 'Component1', component: MockComponent },
        { name: 'Component2', component: MockComponent },
      ]);

      expect(registry.size).toBe(2);
      registry.clear();
      expect(registry.size).toBe(0);
    });
  });

  describe('size', () => {
    it('should return the number of registered components', () => {
      expect(registry.size).toBe(0);

      registry.register({ name: 'Component1', component: MockComponent });
      expect(registry.size).toBe(1);

      registry.register({ name: 'Component2', component: MockComponent });
      expect(registry.size).toBe(2);
    });
  });
});

describe('Global Registry Functions', () => {
  beforeEach(() => {
    globalRegistry.clear();
  });

  describe('registerComponent', () => {
    it('should register component with global registry', () => {
      registerComponent({
        name: 'TestComponent',
        component: MockComponent,
      });

      expect(globalRegistry.size).toBe(1);
      expect(hasComponent('TestComponent')).toBe(true);
    });
  });

  describe('registerComponents', () => {
    it('should register multiple components with global registry', () => {
      registerComponents([
        { name: 'Component1', component: MockComponent },
        { name: 'Component2', component: MockComponent },
      ]);

      expect(globalRegistry.size).toBe(2);
    });
  });

  describe('getComponent', () => {
    it('should get component from global registry', () => {
      const item = { name: 'TestComponent', component: MockComponent };
      registerComponent(item);

      expect(getComponent('TestComponent')).toEqual(item);
    });
  });

  describe('hasComponent', () => {
    it('should check if component exists in global registry', () => {
      registerComponent({
        name: 'TestComponent',
        component: MockComponent,
      });

      expect(hasComponent('TestComponent')).toBe(true);
      expect(hasComponent('Unknown')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered types from global registry', () => {
      registerComponents([
        { name: 'Component1', component: MockComponent },
        { name: 'Component2', component: MockComponent },
      ]);

      const types = getRegisteredTypes();
      expect(types).toHaveLength(2);
      expect(types).toContain('Component1');
      expect(types).toContain('Component2');
    });
  });
});

describe('isComponentType', () => {
  it('should return true when component matches type', () => {
    const component: SDUIComponent = {
      id: 'test-1',
      type: 'Button',
    };

    expect(isComponentType(component, 'Button')).toBe(true);
  });

  it('should return false when component does not match type', () => {
    const component: SDUIComponent = {
      id: 'test-1',
      type: 'Button',
    };

    expect(isComponentType(component, 'Text')).toBe(false);
  });
});
