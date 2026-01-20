/**
 * SDUI Dynamic Renderer
 *
 * Renders SDUI component trees dynamically based on server-provided definitions.
 * Handles component lookup, prop passing, and action execution.
 */

import { useState, useCallback, Suspense } from 'react';
import type { SDUIComponent, AnySDUIComponent, SDUIAction, SDUIRendererContext } from './types';
import { getComponent, hasComponent, getRegisteredTypes, registerComponent } from './registry';

// Import component registration to ensure components are available
import './components';

/**
 * Renderer Props
 */
export interface SDUIRendererProps {
  /** Component tree to render */
  component: SDUIComponent;
  /** Context for rendering */
  context?: Partial<SDUIRendererContext>;
  /** Fallback component for unknown types */
  FallbackComponent?: React.ComponentType<{ component: SDUIComponent; error?: string }>;
  /** Loading component */
  LoadingComponent?: React.ComponentType;
  /** Error boundary fallback */
  onError?: (error: Error, component: SDUIComponent) => void;
}

/**
 * Default fallback component
 */
function DefaultFallbackComponent({ component, error }: { component: SDUIComponent; error?: string }) {
  const errorMsg = error || `Unknown component type: ${component.type}`;
  return (
    <div
      data-sdui-fallback
      data-component-type={component.type}
      data-component-id={component.id}
      className="sdui-fallback"
      style={{
        padding: '1rem',
        border: '1px dashed #ef4444',
        borderRadius: '0.375rem',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
      }}
    >
      <strong>SDUI Error:</strong> {errorMsg}
    </div>
  );
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div
      data-sdui-loading
      className="sdui-loading"
      style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
      }}
    >
      Loading...
    </div>
  );
}

/**
 * Main Renderer Component
 */
export function SDUIRenderer({
  component,
  context: externalContext,
  FallbackComponent = DefaultFallbackComponent,
  LoadingComponent = DefaultLoadingComponent,
  onError,
}: SDUIRendererProps): React.ReactElement | null {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Handle action execution
  const handleAction = useCallback(
    async (action: SDUIAction, componentId: string) => {
      try {
        setLoadingStates((prev) => ({ ...prev, [componentId]: true }));
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[componentId];
          return newErrors;
        });

        // Handle different action types
        switch (action.type) {
          case 'navigation':
            if (typeof action.payload === 'string') {
              window.location.href = action.payload;
            } else if (action.payload.url && typeof action.payload.url === 'string') {
              window.location.href = action.payload.url;
            }
            break;

          case 'api':
            await fetch(action.payload as string, {
              method: action.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(action.headers || {}),
              },
            });
            break;

          case 'server':
            // Check if global handler exists (injected by runtime)
            if ((window as any).SERVER_ACTION_HANDLER) {
               // Collect values from formValues if specified
               const params = { ...(action.params || {}) };
               if (action.collectValues && Array.isArray(action.collectValues)) {
                  action.collectValues.forEach((key: string) => {
                      if (formValues[key]) params[key] = formValues[key];
                  });
               }

               const result = await (window as any).SERVER_ACTION_HANDLER(action.functionName, params);
               if (result && result.error) throw new Error(result.error);

               // If success, maybe refresh? For now just log or reload if needed.
               // Ideally we should have a way to update local state or re-fetch data.
               if (action.onSuccess === 'refresh') {
                   window.location.reload();
               }
            } else {
                console.warn('No server action handler found');
            }
            break;

          case 'scroll':
            const element = document.querySelector(action.payload as string);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
            break;

          case 'custom':
            // Emit custom event for app-specific handling
            window.dispatchEvent(
              new CustomEvent('sdui:action', {
                detail: { action, componentId },
              })
            );
            break;
        }

        // Call external context handler if provided
        if (externalContext?.onAction) {
          await externalContext.onAction(action, componentId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setErrors((prev) => ({ ...prev, [componentId]: errorMessage }));
        onError?.(error instanceof Error ? error : new Error(errorMessage), component);
      } finally {
        setLoadingStates((prev) => ({ ...prev, [componentId]: false }));
      }
    },
    [externalContext?.onAction, onError]
  );

  // Handle form value changes
  const handleInputChange = useCallback(
    (name: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Build renderer context - use useMemo to prevent unnecessary recreations
  const rendererContext: SDUIRendererContext = {
    onAction: handleAction,
    loadingStates,
    formValues,
    errors,
    ...externalContext?.data,
  };

  // Check visibility
  if (component.visible === false) {
    return null;
  }

  // Get component from registry
  const registryItem = getComponent(component.type);

  if (!registryItem) {
    return <FallbackComponent component={component} />;
  }

  // Render the component
  const Component = registryItem.component;

  // Merge default props with provided props
  const props = {
    ...registryItem.defaultProps,
    ...component,
    // Pass renderer context through a special prop
    __sdui_context__: rendererContext,
  };

  // For root-level renderer, add wrapper div. For nested renders, render directly.
  const isRootRenderer = !props.__sdui_context__;

  if (isRootRenderer) {
    return (
      <div
        data-sdui-component="true"
        data-component-type={component.type}
        data-component-id={component.id}
        className={component.className || undefined}
        style={component.style}
      >
        <Suspense fallback={<LoadingComponent />}>
          <Component {...props} />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * HOC to add renderer context to a component
 */
export function withSDUIContext<P extends SDUIComponent>(
  Component: React.ComponentType<P & { __sdui_context__?: SDUIRendererContext }>
): React.ComponentType<P> {
  return function SDUIContextWrapper(props: P) {
    const context = (props as P & { __sdui_context__?: SDUIRendererContext }).__sdui_context__;
    return <Component {...props} context={context} />;
  };
}

/**
 * Hook to access SDUI context from within a component
 */
export function useSDUIContext(): SDUIRendererContext | undefined {
  // This would typically use React Context, but for simplicity
  // we're passing it through props in this implementation
  return undefined;
}

/**
 * Utility to check if a component is loading
 */
export function useSDUILoadingState(
  context: SDUIRendererContext | undefined,
  componentId: string
): boolean {
  return context?.loadingStates?.[componentId] || false;
}

/**
 * Utility to get component error
 */
export function useSDUIError(
  context: SDUIRendererContext | undefined,
  componentId: string
): string | undefined {
  return context?.errors?.[componentId];
}

/**
 * Utility to execute an action
 */
export function useSDUIAction(): (
  action: SDUIAction,
  componentId: string
) => Promise<void> {
  const executeAction = useCallback(async (action: SDUIAction, componentId: string) => {
    // Emit custom event for the renderer to handle
    window.dispatchEvent(
      new CustomEvent('sdui:action', {
        detail: { action, componentId },
      })
    );
  }, []);

  return executeAction;
}
