/**
 * SDUI Main Export
 *
 * Central export point for all SDUI functionality.
 */

// Types
export type {
  AnySDUIComponent,
  SDUIComponent,
  SDUITextComponent,
  SDUIButtonComponent,
  SDUIContainerComponent,
  SDUICardComponent,
  SDUIImageComponent,
  SDUIInputComponent,
  SDUIFormComponent,
  SDUIListComponent,
  SDUIHeroComponent,
  SDUIBadgeComponent,
  SDUIDividerComponent,
  SDUISpacerComponent,
  SDUIAction,
  SDUIView,
  SDUIComponentRegistryItem,
  SDUIRendererContext,
  JSONSchema7,
} from './types';

// Registry
export {
  SDUIComponentRegistry,
  globalRegistry,
  registerComponent,
  registerComponents,
  getComponent,
  hasComponent,
  getRegisteredTypes,
  isComponentType,
  getComponentProps,
} from './registry';

// Renderer
export {
  SDUIRenderer,
  withSDUIContext,
  useSDUIContext,
  useSDUILoadingState,
  useSDUIError,
  useSDUIAction,
} from './renderer';
