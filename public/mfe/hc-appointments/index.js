/**
 * Healthcare Appointments MFE
 * Calendar view with appointment management
 */
const { useState } = window.React;
const h = window.React.createElement;

export default function Appointments({ context }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day');

    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const [appointments] = useState([
        { id: 1, time: '09:00', duration: 60, patient: 'John Smith', type: 'Check-up', doctor: 'Dr. Smith', room: 'Room 101', color: '#3b82f6' },
        { id: 2, time: '10:30', duration: 30, patient: 'Emma Wilson', type: 'Follow-up', doctor: 'Dr. Smith', room: 'Room 101', color: '#10b981' },
        { id: 3, time: '11:00', duration: 45, patient: 'Michael Brown', type: 'Consultation', doctor: 'Dr. Johnson', room: 'Room 102', color: '#8b5cf6' },
        { id: 4, time: '14:00', duration: 30, patient: 'Sarah Davis', type: 'Lab Results', doctor: 'Dr. Smith', room: 'Room 101', color: '#f59e0b' },
        { id: 5, time: '15:30', duration: 60, patient: 'James Johnson', type: 'Physical Exam', doctor: 'Dr. Williams', room: 'Room 103', color: '#ef4444' },
    ]);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    return h('div', { style: { padding: '0.5rem' } },
        // Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } },
            h('div', null,
                h('h1', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e3a5f', margin: 0 } }, 'Appointments'),
                h('p', { style: { color: '#64748b', marginTop: '0.25rem' } }, formatDate(selectedDate))
            ),
            h('div', { style: { display: 'flex', gap: '0.5rem' } },
                ['day', 'week', 'month'].map(mode =>
                    h('button', {
                        key: mode,
                        onClick: () => setViewMode(mode),
                        style: {
                            padding: '0.5rem 1rem',
                            background: viewMode === mode ? '#1e3a5f' : 'white',
                            color: viewMode === mode ? 'white' : '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                        }
                    }, mode)
                ),
                h('button', {
                    style: {
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginLeft: '1rem',
                        fontWeight: '500'
                    }
                }, '+ New Appointment')
            )
        ),

        // Calendar Grid
        h('div', { style: { display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0' } },
            // Time Column
            h('div', { style: { paddingTop: '60px' } },
                timeSlots.map(time =>
                    h('div', {
                        key: time,
                        style: {
                            height: '80px',
                            borderRight: '1px solid #e2e8f0',
                            paddingRight: '1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            fontSize: '0.75rem',
                            color: '#64748b'
                        }
                    }, time)
                )
            ),

            // Appointments Column
            h('div', {
                style: {
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative'
                }
            },
                // Header
                h('div', {
                    style: {
                        padding: '1rem',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: '600',
                        color: '#1e3a5f'
                    }
                }, 'Today'),

                // Time Grid Lines
                h('div', { style: { position: 'relative' } },
                    timeSlots.map((time, i) =>
                        h('div', {
                            key: time,
                            style: {
                                height: '80px',
                                borderBottom: '1px solid #f1f5f9'
                            }
                        })
                    ),

                    // Appointments
                    h('div', { style: { position: 'absolute', top: 0, left: '1rem', right: '1rem' } },
                        appointments.map(apt => {
                            const hour = parseInt(apt.time.split(':')[0]);
                            const minute = parseInt(apt.time.split(':')[1]);
                            const top = ((hour - 8) * 80) + (minute / 60 * 80);
                            const height = (apt.duration / 60) * 80 - 4;

                            return h('div', {
                                key: apt.id,
                                style: {
                                    position: 'absolute',
                                    top: `${top}px`,
                                    left: 0,
                                    right: 0,
                                    height: `${height}px`,
                                    background: apt.color + '15',
                                    borderLeft: `4px solid ${apt.color}`,
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    cursor: 'pointer'
                                }
                            },
                                h('p', { style: { margin: 0, fontWeight: '600', fontSize: '0.875rem', color: apt.color } }, apt.patient),
                                h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, `${apt.type} • ${apt.room}`),
                                apt.duration >= 60 && h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, apt.doctor)
                            );
                        })
                    )
                )
            )
        ),

        // Quick Stats
        h('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginTop: '1.5rem'
            }
        },
            [
                { label: 'Total Today', value: appointments.length, icon: '📅' },
                { label: 'Completed', value: 2, icon: '✅' },
                { label: 'In Progress', value: 1, icon: '🔄' },
                { label: 'Upcoming', value: 2, icon: '⏰' }
            ].map((stat, i) =>
                h('div', {
                    key: i,
                    style: {
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }
                },
                    h('span', { style: { fontSize: '1.5rem' } }, stat.icon),
                    h('div', null,
                        h('p', { style: { margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1e3a5f' } }, stat.value),
                        h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, stat.label)
                    )
                )
            )
        )
    );
}
