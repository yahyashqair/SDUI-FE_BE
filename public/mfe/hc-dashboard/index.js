/**
 * Healthcare Dashboard MFE
 * Main dashboard with stats, charts, and recent activity
 */

export function mount(container, { deps, eventBus, config }) {
    const { React, ReactDOM } = deps;
    const { useState, useEffect } = React;
    const h = React.createElement;

    // Define the component inside to close over deps
    function Dashboard() {
        const [stats] = useState([
            { label: 'Total Patients', value: '2,847', change: '+12%', color: '#3b82f6' },
            { label: 'Appointments Today', value: '24', change: '+3', color: '#10b981' },
            { label: 'Pending Reports', value: '18', change: '-5', color: '#f59e0b' },
            { label: 'Revenue MTD', value: '$48,290', change: '+8.2%', color: '#8b5cf6' }
        ]);

        const [appointments] = useState([
            { time: '09:00', patient: 'John Smith', type: 'Check-up', status: 'completed' },
            { time: '10:30', patient: 'Emma Wilson', type: 'Follow-up', status: 'completed' },
            { time: '11:00', patient: 'Michael Brown', type: 'Consultation', status: 'in-progress' },
            { time: '14:00', patient: 'Sarah Davis', type: 'Lab Results', status: 'upcoming' },
            { time: '15:30', patient: 'James Johnson', type: 'Check-up', status: 'upcoming' }
        ]);

        const [recentPatients] = useState([
            { name: 'Alice Cooper', age: 34, condition: 'Hypertension', lastVisit: '2 days ago' },
            { name: 'Bob Martinez', age: 52, condition: 'Diabetes Type 2', lastVisit: '1 week ago' },
            { name: 'Carol White', age: 28, condition: 'Pregnancy', lastVisit: '3 days ago' },
            { name: 'David Lee', age: 45, condition: 'Arthritis', lastVisit: '5 days ago' }
        ]);

        const statusColors = {
            'completed': '#10b981',
            'in-progress': '#3b82f6',
            'upcoming': '#6b7280'
        };

        return h('div', { style: { padding: '0.5rem' } },
            // Header
            h('div', { style: { marginBottom: '1.5rem' } },
                h('h1', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e3a5f', margin: 0 } },
                    config.title || 'Good Morning, Dr. Smith 👋'),
                h('p', { style: { color: '#64748b', marginTop: '0.25rem' } },
                    "Here's what's happening with your patients today.")
            ),

            // Stats Grid
            h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }
            },
                stats.map((stat, i) =>
                    h('div', {
                        key: i,
                        style: {
                            background: 'white',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            borderLeft: `4px solid ${stat.color}`
                        }
                    },
                        h('p', { style: { color: '#64748b', fontSize: '0.875rem', margin: 0 } }, stat.label),
                        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' } },
                            h('span', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' } }, stat.value),
                            h('span', { style: { fontSize: '0.75rem', color: stat.change.startsWith('+') ? '#10b981' : '#ef4444' } }, stat.change)
                        )
                    )
                )
            ),

            // Two Column Layout
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' } },
                // Today's Appointments
                h('div', {
                    style: {
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } },
                        h('h2', { style: { fontSize: '1.125rem', fontWeight: '600', color: '#1e3a5f', margin: 0 } }, "Today's Appointments"),
                        h('span', { style: { fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' } }, 'View All →')
                    ),
                    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
                        appointments.map((apt, i) =>
                            h('div', {
                                key: i,
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    gap: '1rem'
                                }
                            },
                                h('span', { style: { fontSize: '0.875rem', fontWeight: '600', color: '#1e3a5f', minWidth: '50px' } }, apt.time),
                                h('div', { style: { flex: 1 } },
                                    h('p', { style: { margin: 0, fontWeight: '500', color: '#1e293b' } }, apt.patient),
                                    h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, apt.type)
                                ),
                                h('span', {
                                    style: {
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        background: statusColors[apt.status] + '20',
                                        color: statusColors[apt.status],
                                        textTransform: 'capitalize'
                                    }
                                }, apt.status.replace('-', ' '))
                            )
                        )
                    )
                ),

                // Recent Patients
                h('div', {
                    style: {
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } },
                        h('h2', { style: { fontSize: '1.125rem', fontWeight: '600', color: '#1e3a5f', margin: 0 } }, 'Recent Patients'),
                        h('span', { style: { fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' } }, 'View All →')
                    ),
                    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
                        recentPatients.map((patient, i) =>
                            h('div', {
                                key: i,
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    gap: '1rem'
                                }
                            },
                                h('div', {
                                    style: {
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600'
                                    }
                                }, patient.name.split(' ').map(n => n[0]).join('')),
                                h('div', { style: { flex: 1 } },
                                    h('p', { style: { margin: 0, fontWeight: '500', color: '#1e293b' } }, patient.name),
                                    h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } },
                                        `${patient.age}y • ${patient.condition}`)
                                ),
                                h('span', { style: { fontSize: '0.75rem', color: '#64748b' } }, patient.lastVisit)
                            )
                        )
                    )
                )
            )
        );
    }

    // Mount the component
    // If we were using ShadowDOM, we'd mount to the shadow root here
    ReactDOM.render(h(Dashboard), container);

    // Return cleanup function
    return () => {
        ReactDOM.unmountComponentAtNode(container);
    };
}

