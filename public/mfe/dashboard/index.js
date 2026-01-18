/**
 * Example MFE: Dashboard (Browser-Compatible Version)
 * 
 * Uses React.createElement instead of JSX for direct browser execution.
 * In production, the MFE Builder would compile JSX to this format.
 */
const React = window.React;
const { useState, useEffect } = React;

export default function DashboardMFE({ context }) {
    const { variables, globalState, setGlobalState, callAPI, navigate } = context;
    const [count, setCount] = useState(0);
    const h = React.createElement;

    return h('div', { style: { padding: '2rem', fontFamily: 'system-ui, sans-serif' } },
        h('h1', { style: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' } },
            '🚀 Dynamic Dashboard MFE'
        ),
        h('p', { style: { color: '#666', marginBottom: '2rem' } },
            'This entire page was loaded dynamically from the Route Registry.'
        ),

        // Stats Grid
        h('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }
        },
            h('div', {
                style: {
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }
            },
                h('div', { style: { fontSize: '0.875rem', opacity: 0.8 } }, 'Total Users'),
                h('div', { style: { fontSize: '2rem', fontWeight: 'bold' } }, '12,847')
            ),
            h('div', {
                style: {
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }
            },
                h('div', { style: { fontSize: '0.875rem', opacity: 0.8 } }, 'Revenue'),
                h('div', { style: { fontSize: '2rem', fontWeight: 'bold' } }, '$284,592')
            ),
            h('div', {
                style: {
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                    borderRadius: '12px',
                    color: 'white'
                }
            },
                h('div', { style: { fontSize: '0.875rem', opacity: 0.8 } }, 'Active Sessions'),
                h('div', { style: { fontSize: '2rem', fontWeight: 'bold' } }, '1,429')
            )
        ),

        // Interactive Counter Demo
        h('div', {
            style: {
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '12px',
                border: '1px solid #0ea5e9',
                marginBottom: '2rem'
            }
        },
            h('h2', { style: { fontWeight: '600', marginBottom: '1rem' } }, 'Interactive State Demo'),
            h('p', { style: { marginBottom: '1rem' } }, `Counter: ${count}`),
            h('button', {
                onClick: () => setCount(c => c + 1),
                style: {
                    padding: '0.5rem 1rem',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '0.5rem'
                }
            }, 'Increment'),
            h('button', {
                onClick: () => setCount(0),
                style: {
                    padding: '0.5rem 1rem',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }
            }, 'Reset')
        ),

        // Context Display
        h('div', {
            style: {
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
            }
        },
            h('h2', { style: { fontWeight: '600', marginBottom: '1rem' } }, 'Context Variables'),
            h('pre', {
                style: {
                    background: '#1f2937',
                    color: '#d1d5db',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    overflow: 'auto'
                }
            }, JSON.stringify({ variables, globalState }, null, 2))
        ),

        // Navigation Button
        h('button', {
            onClick: () => navigate('/app/products'),
            style: {
                marginTop: '1.5rem',
                padding: '0.75rem 1.5rem',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer'
            }
        }, 'Navigate to Products →')
    );
}
