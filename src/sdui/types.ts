/**
 * SDUI Type Definitions
 *
 * Server-Driven UI (SDUI) allows the server to send component definitions
 * that the client renders dynamically. This provides flexibility for A/B testing,
 * feature flags, and personalized UI without app updates.
 */

/**
 * Base interface for all SDUI components
 */
export interface SDUIComponent {
  /** Unique identifier for this component instance */
  id: string;
  /** Component type name (must match registry key) */
  type: string;
  /** CSS classes for styling */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** Visibility flag */
  visible?: boolean;
  /** Accessibility attributes */
  aria?: {
    label?: string;
    describedBy?: string;
    role?: string;
  };
  /** Test ID for testing */
  testId?: string;
  /** Internal context (for testing/debugging) */
  __sdui_context__?: Record<string, unknown>;
  /** Data binding key (e.g., "user.name") */
  bind?: string;
}

/**
 * Text component for rendering text content
 */
export interface SDUITextComponent extends SDUIComponent {
  type: 'Text';
  content: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label';
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

/**
 * Button component with variants
 */
export interface SDUIButtonComponent extends SDUIComponent {
  type: 'Button';
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  action?: SDUIAction;
}

/**
 * Container component for layout
 */
export interface SDUIContainerComponent extends SDUIComponent {
  type: 'Container';
  children: SDUIComponent[];
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  gap?: string;
  padding?: string;
  margin?: string;
  maxWidth?: string;
}

/**
 * Card component for content grouping
 */
export interface SDUICardComponent extends SDUIComponent {
  type: 'Card';
  children: SDUIComponent[];
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: string;
  clickable?: boolean;
  action?: SDUIAction;
}

/**
 * Image component
 */
export interface SDUIImageComponent extends SDUIComponent {
  type: 'Image';
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
}

/**
 * Input component for forms
 */
export interface SDUIInputComponent extends SDUIComponent {
  type: 'Input';
  name: string;
  placeholder?: string;
  value?: string;
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Form component with validation
 */
export interface SDUIFormComponent extends SDUIComponent {
  type: 'Form';
  children: SDUIComponent[];
  action?: string;
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  onSubmit?: SDUIAction;
}

/**
 * List component for rendering arrays
 */
export interface SDUIListComponent extends SDUIComponent {
  type: 'List';
  items: SDUIComponent[];
  variant?: 'bulleted' | 'numbered' | 'none';
  spacing?: 'tight' | 'normal' | 'relaxed';
}

/**
 * Hero/Landing section component
 */
export interface SDUIHeroComponent extends SDUIComponent {
  type: 'Hero';
  title: string;
  subtitle?: string;
  description?: string;
  primaryAction?: SDUIButtonComponent;
  secondaryAction?: SDUIButtonComponent;
  image?: SDUIImageComponent;
  alignment?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Badge/Tag component
 */
export interface SDUIBadgeComponent extends SDUIComponent {
  type: 'Badge';
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

/**
 * Divider component
 */
export interface SDUIDividerComponent extends SDUIComponent {
  type: 'Divider';
  orientation?: 'horizontal' | 'vertical';
  thickness?: string;
  color?: string;
}

/**
 * Spacer component
 */
export interface SDUISpacerComponent extends SDUIComponent {
  type: 'Spacer';
  size?: string;
}

/**
 * Theme Switcher component
 */
export interface SDUIThemeSwitcherComponent extends SDUIComponent {
  type: 'ThemeSwitcher';
}

/**
 * Tab Item definition
 */
export interface SDUITabItem {
  label: string;
  content: SDUIComponent;
}

/**
 * Tabs component
 */
export interface SDUITabsComponent extends SDUIComponent {
  type: 'Tabs';
  items: SDUITabItem[];
  defaultActiveIndex?: number;
  onTabChange?: SDUIAction;
}

/**
 * Workflow Step definition
 */
export interface SDUIWorkflowStep {
  type: 'http' | 'setState' | 'navigate' | 'validate' | 'wait' | 'log';
  payload?: any;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  condition?: string; // e.g. "$state.isValid"
  target?: string; // for setState, e.g. "users"
  value?: any; // for setState
}

/**
 * Action that can be triggered by user interaction
 */
export interface SDUIAction {
  type: 'navigation' | 'api' | 'custom' | 'scroll' | 'modal' | 'workflow';
  payload?: string | Record<string, unknown>;
  // For legacy/simple actions
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  // For workflow actions
  steps?: SDUIWorkflowStep[];
}

/**
 * Complete SDUI view sent from server
 */
export interface SDUIView {
  /** Version of the SDUI schema */
  version: string;
  /** Page title */
  title?: string;
  /** Initial State Variables */
  variables?: Record<string, any>;
  /** Page metadata */
  meta?: {
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  /** Root component tree */
  root: SDUIComponent;
  /** Global styles */
  styles?: {
    css?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
}

/**
 * Union type of all possible SDUI components
 */
export type AnySDUIComponent =
  | SDUITextComponent
  | SDUIButtonComponent
  | SDUIContainerComponent
  | SDUICardComponent
  | SDUIImageComponent
  | SDUIInputComponent
  | SDUIFormComponent
  | SDUIListComponent
  | SDUIHeroComponent
  | SDUIBadgeComponent
  | SDUIDividerComponent
  | SDUISpacerComponent
  | SDUIThemeSwitcherComponent
  | SDUITabsComponent;

/**
 * Component registry item
 */
export interface SDUIComponentRegistryItem {
  /** Component display name */
  name: string;
  /** React component */
  component: React.ComponentType<SDUIComponent>;
  /** Schema for validation */
  schema?: JSONSchema7;
  /** Default props */
  defaultProps?: Partial<SDUIComponent>;
}

/**
 * JSON Schema for validation
 */
export interface JSONSchema7 {
  type?: string;
  properties?: Record<string, JSONSchema7>;
  required?: string[];
  items?: JSONSchema7;
  enum?: (string | number | boolean | null)[];
  const?: string | number | boolean | null;
  [key: string]: unknown;
}

/**
 * Renderer context
 */
export interface SDUIRendererContext {
  /** Handle action execution */
  onAction: (action: SDUIAction, componentId: string) => void | Promise<void>;
  /** Component loading states */
  loadingStates?: Record<string, boolean>;
  /** Form values */
  formValues?: Record<string, string>;
  /** Error states */
  errors?: Record<string, string>;
  /** Additional context data */
  data?: Record<string, unknown>;
}
