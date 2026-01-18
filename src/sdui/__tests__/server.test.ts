/**
 * SDUI Server Utilities Tests
 *
 * Unit tests for server-side SDUI utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  resetIdCounter,
  text,
  button,
  container,
  card,
  image,
  input,
  list,
  hero,
  badge,
  divider,
  spacer,
  action,
  navigateAction,
  apiAction,
  scrollAction,
  createView,
  SDUIBuilder,
  validateComponent,
  validateView,
  serializeView,
  deserializeView,
  cloneComponent,
  mergeStyles,
} from '../server';
import type { SDUIComponent } from '../types';

describe('ID Generation', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).toBe('sdui-1');
    expect(id2).toBe('sdui-2');
    expect(id3).toBe('sdui-3');
  });

  it('should generate IDs with custom prefix', () => {
    const id = generateId('custom');
    expect(id).toBe('custom-1');
  });

  it('should reset counter', () => {
    generateId();
    generateId();
    resetIdCounter();
    const id = generateId();
    expect(id).toBe('sdui-1');
  });
});

describe('Component Builders', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('text', () => {
    it('should create text component', () => {
      const component = text('Hello World');

      expect(component).toEqual({
        id: 'text-1',
        type: 'Text',
        content: 'Hello World',
      });
    });

    it('should merge options', () => {
      const component = text('Hello', {
        variant: 'h1',
        size: '2xl',
      });

      expect(component).toEqual({
        id: 'text-1',
        type: 'Text',
        content: 'Hello',
        variant: 'h1',
        size: '2xl',
      });
    });
  });

  describe('button', () => {
    it('should create button component', () => {
      const component = button('Click me');

      expect(component).toEqual({
        id: 'button-1',
        type: 'Button',
        label: 'Click me',
      });
    });

    it('should merge options', () => {
      const component = button('Submit', {
        variant: 'primary',
        size: 'lg',
      });

      expect(component).toEqual({
        id: 'button-1',
        type: 'Button',
        label: 'Submit',
        variant: 'primary',
        size: 'lg',
      });
    });
  });

  describe('container', () => {
    it('should create container component', () => {
      const children = [text('Child 1'), text('Child 2')];
      const component = container(children);

      expect(component.type).toBe('Container');
      expect(component.children).toEqual(children);
      expect(component.direction).toBe('column');
    });
  });

  describe('card', () => {
    it('should create card component', () => {
      const children = [text('Card content')];
      const component = card(children);

      expect(component.type).toBe('Card');
      expect(component.children).toEqual(children);
      expect(component.variant).toBe('default');
    });
  });

  describe('image', () => {
    it('should create image component', () => {
      const component = image('/photo.jpg', 'A photo');

      expect(component).toEqual({
        id: 'image-1',
        type: 'Image',
        src: '/photo.jpg',
        alt: 'A photo',
        fit: 'cover',
        loading: 'lazy',
      });
    });
  });

  describe('input', () => {
    it('should create input component', () => {
      const component = input('email');

      expect(component).toEqual({
        id: 'input-1',
        type: 'Input',
        name: 'email',
        inputType: 'text',
        required: false,
        disabled: false,
      });
    });
  });

  describe('list', () => {
    it('should create list component', () => {
      const items = [text('Item 1'), text('Item 2')];
      const component = list(items);

      expect(component.type).toBe('List');
      expect(component.items).toEqual(items);
      expect(component.variant).toBe('none');
    });
  });

  describe('hero', () => {
    it('should create hero component', () => {
      const component = hero('Welcome');

      expect(component).toEqual({
        id: 'hero-1',
        type: 'Hero',
        title: 'Welcome',
        alignment: 'center',
        size: 'lg',
      });
    });
  });

  describe('badge', () => {
    it('should create badge component', () => {
      const component = badge('New');

      expect(component).toEqual({
        id: 'badge-1',
        type: 'Badge',
        label: 'New',
        variant: 'default',
        size: 'md',
      });
    });
  });

  describe('divider', () => {
    it('should create divider component', () => {
      const component = divider();

      expect(component).toEqual({
        id: 'divider-1',
        type: 'Divider',
        orientation: 'horizontal',
        thickness: '1px',
        color: '#e5e7eb',
      });
    });
  });

  describe('spacer', () => {
    it('should create spacer component', () => {
      const component = spacer('2rem');

      expect(component).toEqual({
        id: 'spacer-1',
        type: 'Spacer',
        size: '2rem',
      });
    });
  });
});

describe('Action Builders', () => {
  it('should create navigation action', () => {
    const action = navigateAction('/home');

    expect(action).toEqual({
      type: 'navigation',
      payload: '/home',
    });
  });

  it('should create API action', () => {
    const action = apiAction('/api/data', 'POST', {
      'Content-Type': 'application/json',
    });

    expect(action).toEqual({
      type: 'api',
      payload: '/api/data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('should create scroll action', () => {
    const action = scrollAction('#section');

    expect(action).toEqual({
      type: 'scroll',
      payload: '#section',
    });
  });
});

describe('View Creation', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should create complete view', () => {
    const root = text('Hello World');
    const view = createView(root, {
      title: 'Test Page',
      meta: {
        description: 'A test page',
      },
    });

    expect(view).toEqual({
      version: '1.0.0',
      root,
      title: 'Test Page',
      meta: {
        description: 'A test page',
      },
    });
  });
});

describe('SDUIBuilder', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should build view using fluent API', () => {
    const root = text('Content');
    const view = new SDUIBuilder()
      .setRoot(root)
      .setTitle('Test Page')
      .setMeta({
        description: 'Test description',
      })
      .build();

    expect(view.root).toEqual(root);
    expect(view.title).toBe('Test Page');
    expect(view.meta?.description).toBe('Test description');
  });

  it('should throw error when building without root', () => {
    const builder = new SDUIBuilder();

    expect(() => builder.build()).toThrow('Root component is required');
  });
});

describe('Validation', () => {
  it('should validate valid component', () => {
    const component: SDUIComponent = {
      id: 'test-1',
      type: 'Button',
    };

    expect(validateComponent(component)).toBe(true);
  });

  it('should invalidate component without id', () => {
    const component = {
      type: 'Button',
    } as SDUIComponent;

    expect(validateComponent(component)).toBe(false);
  });

  it('should invalidate component without type', () => {
    const component = {
      id: 'test-1',
    } as SDUIComponent;

    expect(validateComponent(component)).toBe(false);
  });

  it('should validate valid view', () => {
    const view = createView(text('Content'));

    expect(validateView(view)).toBe(true);
  });

  it('should invalidate view without version', () => {
    const view = {
      root: { id: 'test', type: 'Button' },
    } as any;

    expect(validateView(view)).toBe(false);
  });

  it('should invalidate view without root', () => {
    const view = {
      version: '1.0.0',
    } as any;

    expect(validateView(view)).toBe(false);
  });
});

describe('Serialization', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should serialize view to JSON', () => {
    const view = createView(text('Content'), {
      title: 'Test',
    });

    const json = serializeView(view);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1.0.0');
    expect(parsed.root.type).toBe('Text');
    expect(parsed.title).toBe('Test');
  });

  it('should throw error when serializing invalid view', () => {
    const view = {
      version: '1.0.0',
    } as any;

    expect(() => serializeView(view)).toThrow('Invalid SDUI view');
  });

  it('should deserialize JSON to view', () => {
    const original = createView(text('Content'));
    const json = serializeView(original);
    const deserialized = deserializeView(json);

    expect(deserialized).toEqual(original);
  });

  it('should throw error when deserializing invalid JSON', () => {
    expect(() => deserializeView('invalid json')).toThrow();
  });
});

describe('cloneComponent', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('should clone component with new ID', () => {
    const original = text('Original');
    const cloned = cloneComponent(original);

    expect(cloned).not.toBe(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.type).toBe(original.type);
    expect(cloned.content).toBe(original.content);
  });

  it('should use provided ID', () => {
    const original = text('Original');
    const cloned = cloneComponent(original, 'custom-id');

    expect(cloned.id).toBe('custom-id');
  });
});

describe('mergeStyles', () => {
  it('should merge style objects', () => {
    const base = { color: 'red', padding: '1rem' };
    const override = { color: 'blue', margin: '1rem' };
    const merged = mergeStyles(base, override);

    expect(merged).toEqual({
      color: 'blue',
      padding: '1rem',
      margin: '1rem',
    });
  });

  it('should handle empty base', () => {
    const merged = mergeStyles({}, { color: 'red' });
    expect(merged).toEqual({ color: 'red' });
  });

  it('should handle empty override', () => {
    const merged = mergeStyles({ color: 'red' }, {});
    expect(merged).toEqual({ color: 'red' });
  });
});
