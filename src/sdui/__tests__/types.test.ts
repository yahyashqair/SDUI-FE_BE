/**
 * SDUI Type System Tests
 *
 * Unit tests for type definitions and guards.
 */

import { describe, it, expect } from 'vitest';
import type {
  SDUIComponent,
  SDUITextComponent,
  SDUIButtonComponent,
  SDUIContainerComponent,
  SDUICardComponent,
  SDUIImageComponent,
  SDUIInputComponent,
  SDUIListComponent,
  SDUIHeroComponent,
  SDUIBadgeComponent,
  SDUIDividerComponent,
  SDUISpacerComponent,
  AnySDUIComponent,
  SDUIView,
  SDUIAction,
} from '../types';

describe('SDUI Component Types', () => {
  describe('SDUITextComponent', () => {
    it('should create valid text component', () => {
      const component: SDUITextComponent = {
        id: 'text-1',
        type: 'Text',
        content: 'Hello World',
        variant: 'h1',
      };

      expect(component.id).toBe('text-1');
      expect(component.type).toBe('Text');
      expect(component.content).toBe('Hello World');
      expect(component.variant).toBe('h1');
    });

    it('should accept all text variants', () => {
      const variants: SDUITextComponent['variant'][] = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'label',
      ];

      variants.forEach((variant) => {
        const component: SDUITextComponent = {
          id: `text-${variant}`,
          type: 'Text',
          content: 'Test',
          variant,
        };
        expect(component.variant).toBe(variant);
      });
    });
  });

  describe('SDUIButtonComponent', () => {
    it('should create valid button component', () => {
      const component: SDUIButtonComponent = {
        id: 'button-1',
        type: 'Button',
        label: 'Click me',
        variant: 'primary',
      };

      expect(component.label).toBe('Click me');
      expect(component.variant).toBe('primary');
    });

    it('should accept all button variants', () => {
      const variants: SDUIButtonComponent['variant'][] = [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'danger',
      ];

      variants.forEach((variant) => {
        const component: SDUIButtonComponent = {
          id: `button-${variant}`,
          type: 'Button',
          label: 'Test',
          variant,
        };
        expect(component.variant).toBe(variant);
      });
    });
  });

  describe('SDUIContainerComponent', () => {
    it('should create valid container with children', () => {
      const children: SDUIComponent[] = [
        { id: 'text-1', type: 'Text' } as SDUITextComponent,
        { id: 'button-1', type: 'Button', label: 'Click' } as SDUIButtonComponent,
      ];

      const component: SDUIContainerComponent = {
        id: 'container-1',
        type: 'Container',
        children,
        direction: 'row',
      };

      expect(component.children).toHaveLength(2);
      expect(component.direction).toBe('row');
    });
  });

  describe('SDUICardComponent', () => {
    it('should create valid card component', () => {
      const component: SDUICardComponent = {
        id: 'card-1',
        type: 'Card',
        children: [],
        variant: 'elevated',
      };

      expect(component.variant).toBe('elevated');
    });
  });

  describe('SDUIImageComponent', () => {
    it('should create valid image component', () => {
      const component: SDUIImageComponent = {
        id: 'image-1',
        type: 'Image',
        src: '/photo.jpg',
        alt: 'A photo',
        fit: 'cover',
      };

      expect(component.src).toBe('/photo.jpg');
      expect(component.alt).toBe('A photo');
    });
  });

  describe('SDUIInputComponent', () => {
    it('should create valid input component', () => {
      const component: SDUIInputComponent = {
        id: 'input-1',
        type: 'Input',
        name: 'email',
        inputType: 'email',
        required: true,
      };

      expect(component.name).toBe('email');
      expect(component.inputType).toBe('email');
      expect(component.required).toBe(true);
    });
  });

  describe('SDUIListComponent', () => {
    it('should create valid list component', () => {
      const component: SDUIListComponent = {
        id: 'list-1',
        type: 'List',
        items: [],
        variant: 'bulleted',
      };

      expect(component.variant).toBe('bulleted');
    });
  });

  describe('SDUIHeroComponent', () => {
    it('should create valid hero component', () => {
      const component: SDUIHeroComponent = {
        id: 'hero-1',
        type: 'Hero',
        title: 'Welcome',
        alignment: 'center',
      };

      expect(component.title).toBe('Welcome');
      expect(component.alignment).toBe('center');
    });
  });

  describe('SDUIBadgeComponent', () => {
    it('should create valid badge component', () => {
      const component: SDUIBadgeComponent = {
        id: 'badge-1',
        type: 'Badge',
        label: 'New',
        variant: 'success',
      };

      expect(component.label).toBe('New');
      expect(component.variant).toBe('success');
    });
  });

  describe('SDUIDividerComponent', () => {
    it('should create valid divider component', () => {
      const component: SDUIDividerComponent = {
        id: 'divider-1',
        type: 'Divider',
        orientation: 'vertical',
      };

      expect(component.orientation).toBe('vertical');
    });
  });

  describe('SDUISpacerComponent', () => {
    it('should create valid spacer component', () => {
      const component: SDUISpacerComponent = {
        id: 'spacer-1',
        type: 'Spacer',
        size: '2rem',
      };

      expect(component.size).toBe('2rem');
    });
  });
});

describe('SDUIAction', () => {
  it('should create navigation action', () => {
    const action: SDUIAction = {
      type: 'navigation',
      payload: '/home',
    };

    expect(action.type).toBe('navigation');
    expect(action.payload).toBe('/home');
  });

  it('should create API action', () => {
    const action: SDUIAction = {
      type: 'api',
      payload: '/api/data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    expect(action.method).toBe('POST');
    expect(action.headers?.['Content-Type']).toBe('application/json');
  });
});

describe('SDUIView', () => {
  it('should create valid view', () => {
    const view: SDUIView = {
      version: '1.0.0',
      title: 'Test Page',
      root: {
        id: 'text-1',
        type: 'Text',
        content: 'Hello',
      },
      meta: {
        description: 'A test page',
        keywords: ['test', 'demo'],
      },
    };

    expect(view.version).toBe('1.0.0');
    expect(view.title).toBe('Test Page');
    expect(view.meta?.description).toBe('A test page');
    expect(view.meta?.keywords).toEqual(['test', 'demo']);
  });
});

describe('AnySDUIComponent Union Type', () => {
  it('should accept all component types', () => {
    const components: AnySDUIComponent[] = [
      { id: '1', type: 'Text', content: 'Text' } as SDUITextComponent,
      { id: '2', type: 'Button', label: 'Button' } as SDUIButtonComponent,
      { id: '3', type: 'Container', children: [] } as SDUIContainerComponent,
      { id: '4', type: 'Card', children: [] } as SDUICardComponent,
      { id: '5', type: 'Image', src: '/img.jpg', alt: 'Image' } as SDUIImageComponent,
      { id: '6', type: 'Input', name: 'test' } as SDUIInputComponent,
      { id: '7', type: 'List', items: [] } as SDUIListComponent,
      { id: '8', type: 'Hero', title: 'Hero' } as SDUIHeroComponent,
      { id: '9', type: 'Badge', label: 'Badge' } as SDUIBadgeComponent,
      { id: '10', type: 'Divider' } as SDUIDividerComponent,
      { id: '11', type: 'Spacer' } as SDUISpacerComponent,
    ];

    expect(components).toHaveLength(11);
    components.forEach((component) => {
      expect(component.id).toBeTruthy();
      expect(component.type).toBeTruthy();
    });
  });
});
