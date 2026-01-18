import type { SDUIView } from '../sdui/types';
import {
    hero,
    button,
    navigateAction,
    createView,
    container,
    text,
    card,
    list,
    badge,
    tabs
} from '../sdui/server';

/**
 * SDUI Service
 * 
 * Simulates fetching SDUI views from an external source (DB, CMS, API).
 * Currently returns static mock data but can be easily swapped for a real data source.
 */

const MOCK_VIEWS: Record<string, SDUIView> = {
    'home': createView(
        container([
            hero('Dynamic SDUI with Astro', {
                subtitle: 'Fetched from an API and validated with Zod',
                description: 'This view is defined in a service layer and served via an Astro API endpoint.',
                primaryAction: button('View Code', {
                    variant: 'primary',
                    action: navigateAction('https://github.com/withastro/astro')
                }),
                secondaryAction: button('Documentation', {
                    variant: 'outline',
                    action: navigateAction('https://docs.astro.build')
                }),
                alignment: 'center',
                size: 'lg'
            }),
            container([
                text('Recent Updates', { variant: 'h2', align: 'center' }),
                list([
                    card([
                        text('Validation Added', { variant: 'h3' }),
                        text('We now use Zod to validate all incoming JSON definitions.')
                    ], { padding: '1.5rem' }),
                    card([
                        text('API Routes', { variant: 'h3' }),
                        text('Views are fetched dynamically from /api/sdui/[slug].')
                    ], { padding: '1.5rem' })
                ], {
                    variant: 'none',
                    spacing: 'normal',
                    style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }
                })
            ], { padding: '2rem 0', gap: '2rem' })
        ])
    ),
    'dashboard': createView(
        container([
            // Header
            container([
                text('Executive Dashboard', { variant: 'h2', weight: 'bold' }),
                text('Real-time overview of system performance', { color: '#6b7280' })
            ], {
                padding: '0 0 2rem 0',
                style: { borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }
            }),

            // Tabs for State Management Demo
            tabs([
                {
                    label: 'Overview',
                    content: container([
                        // Stats Row
                        container([
                            card([
                                text('Total Revenue', { variant: 'label', color: '#6b7280' }),
                                text('$124,592', { variant: 'h3', weight: 'bold' }),
                                badge('+12.5%', { variant: 'success', size: 'sm' })
                            ], { padding: '1.5rem', style: { backgroundColor: 'white' } }),
                            card([
                                text('Active Users', { variant: 'label', color: '#6b7280' }),
                                text('8,249', { variant: 'h3', weight: 'bold' }),
                                badge('+5.2%', { variant: 'success', size: 'sm' })
                            ], { padding: '1.5rem', style: { backgroundColor: 'white' } }),
                            card([
                                text('Bounce Rate', { variant: 'label', color: '#6b7280' }),
                                text('42.3%', { variant: 'h3', weight: 'bold' }),
                                badge('-2.1%', { variant: 'warning', size: 'sm' })
                            ], { padding: '1.5rem', style: { backgroundColor: 'white' } }),
                            card([
                                text('Server Uptime', { variant: 'label', color: '#6b7280' }),
                                text('99.9%', { variant: 'h3', weight: 'bold' }),
                                badge('Healthy', { variant: 'info', size: 'sm' })
                            ], { padding: '1.5rem', style: { backgroundColor: 'white' } })
                        ], {
                            direction: 'row',
                            gap: '1.5rem',
                            style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }
                        }),
                        text('Overview Content', { variant: 'h4' }),
                        text('This is the main overview tab showing high-level stats.', { color: '#6b7280' })
                    ])
                },
                {
                    label: 'Analytics',
                    content: container([
                        // Left Column: "Charts"
                        container([
                            card([
                                container([
                                    text('Revenue Overview', { variant: 'h4', weight: 'semibold' }),
                                    button('Download Report', { size: 'sm', variant: 'outline' })
                                ], { direction: 'row', justify: 'space-between', align: 'center', style: { marginBottom: '1rem' } }),

                                // Fake Bar Chart Visualization
                                container([
                                    container([], { style: { background: '#e0e7ff', height: '150px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                    container([], { style: { background: '#c7d2fe', height: '100px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                    container([], { style: { background: '#a5b4fc', height: '180px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                    container([], { style: { background: '#818cf8', height: '220px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                    container([], { style: { background: '#6366f1', height: '160px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                    container([], { style: { background: '#4f46e5', height: '250px', width: '40px', borderRadius: '4px 4px 0 0' } }),
                                ], {
                                    direction: 'row',
                                    align: 'end',
                                    justify: 'space-between',
                                    style: { height: '250px', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }
                                }),
                                container([
                                    text('Jan', { size: 'xs' }), text('Feb', { size: 'xs' }), text('Mar', { size: 'xs' }),
                                    text('Apr', { size: 'xs' }), text('May', { size: 'xs' }), text('Jun', { size: 'xs' })
                                ], { direction: 'row', justify: 'space-between' })
                            ], { padding: '1.5rem', style: { height: '100%' } })
                        ], { style: { marginBottom: '2rem' } })
                    ])
                },
                {
                    label: 'Activity',
                    content: container([
                        // Right Column: Activity Feed
                        container([
                            card([
                                text('Recent Activity', { variant: 'h4', weight: 'semibold', style: { marginBottom: '1rem' } }),
                                list([
                                    container([
                                        badge('New Order', { variant: 'success', size: 'sm' }),
                                        text('Order #1234 from Sarah M.', { size: 'sm' }),
                                        text('2 min ago', { size: 'xs', color: '#9ca3af' })
                                    ], { gap: '0.5rem', style: { padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' } }),
                                    container([
                                        badge('Alert', { variant: 'error', size: 'sm' }),
                                        text('High memory usage detected', { size: 'sm' }),
                                        text('15 min ago', { size: 'xs', color: '#9ca3af' })
                                    ], { gap: '0.5rem', style: { padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' } }),
                                    container([
                                        badge('Update', { variant: 'info', size: 'sm' }),
                                        text('System update completed', { size: 'sm' }),
                                        text('1h ago', { size: 'xs', color: '#9ca3af' })
                                    ], { gap: '0.5rem', style: { padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' } }),
                                    container([
                                        badge('User', { variant: 'default', size: 'sm' }),
                                        text('New user registered', { size: 'sm' }),
                                        text('2h ago', { size: 'xs', color: '#9ca3af' })
                                    ], { gap: '0.5rem', style: { padding: '0.75rem 0' } })
                                ], { variant: 'none' })
                            ], { padding: '1.5rem', style: { height: '100%' } })
                        ])
                    ])
                },
                {
                    label: 'Settings',
                    content: container([
                        text('Settings Logic', { variant: 'h3' }),
                        text('This tab demonstrates isolating complex logic in separate views.', { style: { marginBottom: '1rem' } }),
                        button('Save Configuration', { variant: 'primary' })
                    ], { padding: '2rem', style: { backgroundColor: 'white', borderRadius: '0.5rem' } })
                }
            ])
        ])
    )
};

export class SDUIService {
    /**
     * Fetch a view by its slug
     */
    async getView(slug: string): Promise<SDUIView | null> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 300));

        return MOCK_VIEWS[slug] || null;
    }

    /**
     * Get all available view slugs
     */
    async getAllSlugs(): Promise<string[]> {
        return Object.keys(MOCK_VIEWS);
    }

    /**
     * Save a view definition
     */
    async saveView(slug: string, view: SDUIView): Promise<void> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500));
        MOCK_VIEWS[slug] = view;
    }
}

export const sduiService = new SDUIService();
