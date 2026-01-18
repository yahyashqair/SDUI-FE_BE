import { z } from 'zod';

/**
 * Base component schema
 */
export const BaseComponentSchema = z.object({
    id: z.string(),
    type: z.string(),
    className: z.string().optional(),
    style: z.record(z.string()).optional(),
    visible: z.boolean().optional(),
    aria: z.object({
        label: z.string().optional(),
        describedBy: z.string().optional(),
        role: z.string().optional(),
    }).optional(),
    testId: z.string().optional(),
    bind: z.string().optional(),
});

/**
 * Action schema
 */
export const ActionSchema = z.object({
    type: z.enum(['navigation', 'api', 'custom', 'scroll', 'modal', 'workflow']),
    payload: z.union([z.string(), z.record(z.unknown())]).optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    headers: z.record(z.string()).optional(),
    steps: z.array(z.object({
        type: z.enum(['http', 'setState', 'navigate', 'validate', 'wait', 'log']),
        payload: z.any().optional(),
        url: z.string().optional(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
        body: z.any().optional(),
        headers: z.record(z.string()).optional(),
        condition: z.string().optional(),
        target: z.string().optional(),
        value: z.any().optional(),
    })).optional(),
});

/**
 * Text component schema
 */
export const TextSchema = BaseComponentSchema.extend({
    type: z.literal('Text'),
    content: z.string(),
    variant: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label']).optional(),
    color: z.string().optional(),
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']).optional(),
    weight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
});

/**
 * Button component schema
 */
export const ButtonSchema = BaseComponentSchema.extend({
    type: z.literal('Button'),
    label: z.string(),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'danger']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
    icon: z.string().optional(),
    iconPosition: z.enum(['left', 'right']).optional(),
    action: ActionSchema.optional(),
});

// recursive schema definition
import type { AnySDUIComponent } from './types';

const ComponentSchema: z.ZodType<AnySDUIComponent> = z.lazy(() => AnyComponentSchema);

/**
 * Container component schema
 */
export const ContainerSchema = BaseComponentSchema.extend({
    type: z.literal('Container'),
    children: z.array(ComponentSchema),
    direction: z.enum(['row', 'column']).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    justify: z.enum(['start', 'center', 'end', 'space-between', 'space-around']).optional(),
    gap: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    maxWidth: z.string().optional(),
});

/**
 * Card component schema
 */
export const CardSchema = BaseComponentSchema.extend({
    type: z.literal('Card'),
    children: z.array(ComponentSchema),
    variant: z.enum(['default', 'elevated', 'outlined', 'filled']).optional(),
    padding: z.string().optional(),
    clickable: z.boolean().optional(),
    action: ActionSchema.optional(),
});

/**
 * Image component schema
 */
export const ImageSchema = BaseComponentSchema.extend({
    type: z.literal('Image'),
    src: z.string(),
    alt: z.string(),
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    fit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    loading: z.enum(['lazy', 'eager']).optional(),
});

/**
 * Input component schema
 */
export const InputSchema = BaseComponentSchema.extend({
    type: z.literal('Input'),
    name: z.string(),
    placeholder: z.string().optional(),
    value: z.string().optional(),
    inputType: z.enum(['text', 'email', 'password', 'number', 'tel', 'url', 'search']).optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    error: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
});

/**
 * Form component schema
 */
export const FormSchema = BaseComponentSchema.extend({
    type: z.literal('Form'),
    children: z.array(ComponentSchema),
    action: z.string().optional(),
    method: z.enum(['POST', 'GET', 'PUT', 'DELETE']).optional(),
    onSubmit: ActionSchema.optional(),
});

/**
 * List component schema
 */
export const ListSchema = BaseComponentSchema.extend({
    type: z.literal('List'),
    items: z.array(ComponentSchema),
    variant: z.enum(['bulleted', 'numbered', 'none']).optional(),
    spacing: z.enum(['tight', 'normal', 'relaxed']).optional(),
});

/**
 * Hero component schema
 */
export const HeroSchema = BaseComponentSchema.extend({
    type: z.literal('Hero'),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    primaryAction: ButtonSchema.optional(),
    secondaryAction: ButtonSchema.optional(),
    image: ImageSchema.optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
});

/**
 * Badge component schema
 */
export const BadgeSchema = BaseComponentSchema.extend({
    type: z.literal('Badge'),
    label: z.string(),
    variant: z.enum(['default', 'success', 'warning', 'error', 'info']).optional(),
    size: z.enum(['sm', 'md']).optional(),
});

/**
 * Divider component schema
 */
export const DividerSchema = BaseComponentSchema.extend({
    type: z.literal('Divider'),
    orientation: z.enum(['horizontal', 'vertical']).optional(),
    thickness: z.string().optional(),
    color: z.string().optional(),
});

/**
 * Spacer component schema
 */
export const SpacerSchema = BaseComponentSchema.extend({
    type: z.literal('Spacer'),
    size: z.string().optional(),
});

/**
 * ThemeSwitcher component schema
 */
export const ThemeSwitcherSchema = BaseComponentSchema.extend({
    type: z.literal('ThemeSwitcher'),
});

/**
 * Tabs component schema
 */
export const TabsSchema = BaseComponentSchema.extend({
    type: z.literal('Tabs'),
    items: z.array(z.object({
        label: z.string(),
        content: ComponentSchema
    })),
    defaultActiveIndex: z.number().optional(),
    onTabChange: ActionSchema.optional(),
});

/**
 * Union of all component schemas
 */
export const AnyComponentSchema = z.union([
    TextSchema,
    ButtonSchema,
    ContainerSchema,
    CardSchema,
    ImageSchema,
    InputSchema,
    FormSchema,
    ListSchema,
    HeroSchema,
    BadgeSchema,
    DividerSchema,
    SpacerSchema,
    ThemeSwitcherSchema,
    TabsSchema,
]);

/**
 * View schema
 */
export const SDUIViewSchema = z.object({
    version: z.string(),
    title: z.string().optional(),
    variables: z.record(z.any()).optional(),
    meta: z.object({
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        ogImage: z.string().optional(),
    }).optional(),
    root: AnyComponentSchema,
    styles: z.object({
        css: z.string().optional(),
        theme: z.enum(['light', 'dark', 'auto']).optional(),
    }).optional(),
});

export type ParsedSDUIView = z.infer<typeof SDUIViewSchema>;
