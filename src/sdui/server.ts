/**
 * SDUI Server Utilities
 *
 * Utilities for creating SDUI views on the server side.
 * Provides builder patterns for constructing component trees.
 */

import type {
  SDUIView,
  AnySDUIComponent,
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
  SDUIThemeSwitcherComponent,
  SDUITabsComponent,
  SDUIAction,
} from './types';

/**
 * Generate unique ID for components
 */
let idCounter = 0;
export function generateId(prefix = 'sdui'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Create a text component
 */
export function text(
  content: string,
  options?: Partial<SDUITextComponent>
): SDUITextComponent {
  return {
    id: generateId('text'),
    type: 'Text',
    content,
    ...options,
  };
}

/**
 * Create a button component
 */
export function button(
  label: string,
  options?: Partial<SDUIButtonComponent>
): SDUIButtonComponent {
  return {
    id: generateId('button'),
    type: 'Button',
    label,
    ...options,
  };
}

/**
 * Create a container component
 */
export function container(
  children: AnySDUIComponent[],
  options?: Partial<SDUIContainerComponent>
): SDUIContainerComponent {
  return {
    id: generateId('container'),
    type: 'Container',
    children,
    direction: options?.direction ?? 'column',
    align: options?.align,
    justify: options?.justify,
    gap: options?.gap,
    padding: options?.padding,
    margin: options?.margin,
    maxWidth: options?.maxWidth,
    className: options?.className,
    style: options?.style,
    __sdui_context__: options?.__sdui_context__,
    testId: options?.testId,
  };
}

/**
 * Create a card component
 */
export function card(
  children: AnySDUIComponent[],
  options?: Partial<SDUICardComponent>
): SDUICardComponent {
  return {
    id: generateId('card'),
    type: 'Card',
    children,
    variant: options?.variant ?? 'default',
    padding: options?.padding,
    clickable: options?.clickable,
    action: options?.action,
    className: options?.className,
    style: options?.style,
    __sdui_context__: options?.__sdui_context__,
    testId: options?.testId,
  };
}

/**
 * Create an image component
 */
export function image(
  src: string,
  alt: string,
  options?: Partial<SDUIImageComponent>
): SDUIImageComponent {
  return {
    id: generateId('image'),
    type: 'Image',
    src,
    alt,
    width: options?.width,
    height: options?.height,
    fit: options?.fit ?? 'cover',
    loading: options?.loading ?? 'lazy',
    className: options?.className,
    style: options?.style,
    testId: options?.testId,
  };
}

/**
 * Create an input component
 */
export function input(
  name: string,
  options?: Partial<SDUIInputComponent>
): SDUIInputComponent {
  return {
    id: generateId('input'),
    type: 'Input',
    name,
    placeholder: options?.placeholder,
    value: options?.value,
    inputType: options?.inputType ?? 'text',
    required: options?.required ?? false,
    disabled: options?.disabled ?? false,
    error: options?.error,
    min: options?.min,
    max: options?.max,
    minLength: options?.minLength,
    maxLength: options?.maxLength,
    className: options?.className,
    style: options?.style,
    __sdui_context__: options?.__sdui_context__,
    testId: options?.testId,
  };
}

/**
 * Create a list component
 */
export function list(
  items: AnySDUIComponent[],
  options?: Partial<SDUIListComponent>
): SDUIListComponent {
  return {
    id: generateId('list'),
    type: 'List',
    items,
    variant: options?.variant ?? 'none',
    spacing: options?.spacing,
    className: options?.className,
    style: options?.style,
    __sdui_context__: options?.__sdui_context__,
    testId: options?.testId,
  };
}

/**
 * Create a hero component
 */
export function hero(
  title: string,
  options?: Partial<SDUIHeroComponent>
): SDUIHeroComponent {
  return {
    id: generateId('hero'),
    type: 'Hero',
    title,
    subtitle: options?.subtitle,
    description: options?.description,
    primaryAction: options?.primaryAction,
    secondaryAction: options?.secondaryAction,
    image: options?.image,
    alignment: options?.alignment ?? 'center',
    size: options?.size ?? 'lg',
    className: options?.className,
    style: options?.style,
    __sdui_context__: options?.__sdui_context__,
    testId: options?.testId,
  };
}

/**
 * Create a badge component
 */
export function badge(
  label: string,
  options?: Partial<SDUIBadgeComponent>
): SDUIBadgeComponent {
  return {
    id: generateId('badge'),
    type: 'Badge',
    label,
    variant: options?.variant ?? 'default',
    size: options?.size ?? 'md',
    className: options?.className,
    style: options?.style,
    testId: options?.testId,
  };
}

/**
 * Create a divider component
 */
export function divider(
  options?: Partial<SDUIDividerComponent>
): SDUIDividerComponent {
  return {
    id: generateId('divider'),
    type: 'Divider',
    orientation: options?.orientation ?? 'horizontal',
    thickness: options?.thickness ?? '1px',
    color: options?.color ?? '#e5e7eb',
    className: options?.className,
    style: options?.style,
    testId: options?.testId,
  };
}

/**
 * Create a spacer component
 */
export function spacer(
  size?: string
): SDUISpacerComponent {
  return {
    id: generateId('spacer'),
    type: 'Spacer',
    size,
  };
}

/**
 * Create an action
 */
export function action(
  type: SDUIAction['type'],
  payload: string | Record<string, unknown>,
  options?: Omit<SDUIAction, 'type' | 'payload'>
): SDUIAction {
  return {
    type,
    payload,
    ...options,
  };
}

/**
 * Create a navigation action
 */
export function navigateAction(url: string): SDUIAction {
  return action('navigation', url);
}

/**
 * Create an API action
 */
export function apiAction(
  url: string,
  method: SDUIAction['method'] = 'POST',
  headers?: Record<string, string>
): SDUIAction {
  return action('api', url, { method, headers });
}

/**
 * Create a scroll action
 */
export function scrollAction(selector: string): SDUIAction {
  return action('scroll', selector);
}

/**
 * Create a theme switcher component
 */
export function themeSwitcher(
  options?: Partial<SDUIThemeSwitcherComponent>
): SDUIThemeSwitcherComponent {
  return {
    id: generateId('theme-switcher'),
    type: 'ThemeSwitcher',
    className: options?.className,
    style: options?.style,
  };
}

/**
 * Create a tabs component
 */
export function tabs(
  items: { label: string; content: AnySDUIComponent }[],
  options?: Partial<SDUITabsComponent>
): SDUITabsComponent {
  return {
    id: generateId('tabs'),
    type: 'Tabs',
    items,
    defaultActiveIndex: options?.defaultActiveIndex,
    onTabChange: options?.onTabChange,
    className: options?.className,
    style: options?.style,
  };
}

/**
 * Create a complete SDUI view
 */
export function createView(
  root: AnySDUIComponent,
  options?: Partial<SDUIView>
): SDUIView {
  return {
    version: '1.0.0',
    root,
    ...options,
  };
}

/**
 * SDUI View Builder Class
 *
 * Fluent API for building complex SDUI views.
 */
export class SDUIBuilder {
  private root?: AnySDUIComponent;
  private title?: string;
  private meta?: SDUIView['meta'];

  /**
   * Set the root component
   */
  setRoot(component: AnySDUIComponent): this {
    this.root = component;
    return this;
  }

  /**
   * Set the page title
   */
  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Set page metadata
   */
  setMeta(meta: SDUIView['meta']): this {
    this.meta = meta;
    return this;
  }

  /**
   * Build the final view
   */
  build(): SDUIView {
    if (!this.root) {
      throw new Error('Root component is required. Call setRoot() first.');
    }
    return createView(this.root, {
      title: this.title,
      meta: this.meta,
    });
  }
}

/**
 * Create a new SDUI builder
 */
export function builder(): SDUIBuilder {
  return new SDUIBuilder();
}

/**
 * Validate SDUI component structure
 */
export function validateComponent(component: AnySDUIComponent): boolean {
  if (!component.id || typeof component.id !== 'string') {
    return false;
  }
  if (!component.type || typeof component.type !== 'string') {
    return false;
  }
  return true;
}

/**
 * Validate complete SDUI view
 */
export function validateView(view: SDUIView): boolean {
  if (!view.version || typeof view.version !== 'string') {
    return false;
  }
  if (!view.root) {
    return false;
  }
  return validateComponent(view.root);
}

/**
 * Serialize SDUI view to JSON
 */
export function serializeView(view: SDUIView): string {
  if (!validateView(view)) {
    throw new Error('Invalid SDUI view');
  }
  return JSON.stringify(view);
}

/**
 * Deserialize SDUI view from JSON
 */
export function deserializeView(json: string): SDUIView {
  const view = JSON.parse(json) as SDUIView;
  if (!validateView(view)) {
    throw new Error('Invalid SDUI view JSON');
  }
  return view;
}

/**
 * Clone a component with a new ID
 */
export function cloneComponent<T extends AnySDUIComponent>(
  component: T,
  newId?: string
): T {
  return {
    ...component,
    id: newId || generateId(component.type.toLowerCase()),
  };
}

/**
 * Merge style objects
 */
export function mergeStyles(
  base: Record<string, string> = {},
  override: Record<string, string> = {}
): Record<string, string> {
  return { ...base, ...override };
}

/**
 * Create responsive view based on device type
 */
export interface DeviceContext {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
}

export function createResponsiveView(
  mobile: AnySDUIComponent,
  tablet: AnySDUIComponent,
  desktop: AnySDUIComponent,
  context: DeviceContext
): SDUIView {
  let selectedComponent: AnySDUIComponent;

  switch (context.type) {
    case 'mobile':
      selectedComponent = mobile;
      break;
    case 'tablet':
      selectedComponent = tablet;
      break;
    case 'desktop':
      selectedComponent = desktop;
      break;
  }

  return createView(selectedComponent as AnySDUIComponent);
}
