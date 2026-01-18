/**
 * Healthcare Medical Records MFE
 * Patient records and documents
 */
const { useState } = window.React;
const h = window.React.createElement;

export default function MedicalRecords({ context }) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [records] = useState([
        { id: 'R001', patient: 'John Smith', type: 'Lab Results', category: 'lab', date: '2024-01-15', doctor: 'Dr. Smith', status: 'Final' },
        { id: 'R002', patient: 'Emma Wilson', type: 'X-Ray Report', category: 'imaging', date: '2024-01-14', doctor: 'Dr. Johnson', status: 'Final' },
        { id: 'R003', patient: 'Michael Brown', type: 'Prescription', category: 'prescription', date: '2024-01-12', doctor: 'Dr. Smith', status: 'Active' },
        { id: 'R004', patient: 'Sarah Davis', type: 'Ultrasound', category: 'imaging', date: '2024-01-10', doctor: 'Dr. Williams', status: 'Final' },
        { id: 'R005', patient: 'James Johnson', type: 'Blood Work', category: 'lab', date: '2024-01-16', doctor: 'Dr. Smith', status: 'Pending' },
        { id: 'R006', patient: 'Lisa Anderson', type: 'Consultation Notes', category: 'notes', date: '2024-01-08', doctor: 'Dr. Johnson', status: 'Final' },
        { id: 'R007', patient: 'Robert Taylor', type: 'MRI Scan', category: 'imaging', date: '2024-01-05', doctor: 'Dr. Williams', status: 'Final' },
        { id: 'R008', patient: 'Jennifer Martinez', type: 'Prescription', category: 'prescription', date: '2024-01-11', doctor: 'Dr. Smith', status: 'Active' },
    ]);

    const categories = [
        { id: 'all', label: 'All Records', icon: '📁', count: records.length },
        { id: 'lab', label: 'Lab Results', icon: '🧪', count: records.filter(r => r.category === 'lab').length },
        { id: 'imaging', label: 'Imaging', icon: '🔬', count: records.filter(r => r.category === 'imaging').length },
        { id: 'prescription', label: 'Prescriptions', icon: '💊', count: records.filter(r => r.category === 'prescription').length },
        { id: 'notes', label: 'Notes', icon: '📝', count: records.filter(r => r.category === 'notes').length }
    ];

    const filteredRecords = selectedCategory === 'all'
        ? records
        : records.filter(r => r.category === selectedCategory);

    const statusColors = {
        'Final': { bg: '#dcfce7', text: '#166534' },
        'Pending': { bg: '#fef3c7', text: '#92400e' },
        'Active': { bg: '#dbeafe', text: '#1e40af' }
    };

    const typeIcons = {
        'Lab Results': '🧪',
        'X-Ray Report': '🩻',
        'Prescription': '💊',
        'Ultrasound': '📊',
        'Blood Work': '🩸',
        'Consultation Notes': '📝',
        'MRI Scan': '🧠'
    };

    return h('div', { style: { padding: '0.5rem' } },
        // Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } },
            h('div', null,
                h('h1', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e3a5f', margin: 0 } }, 'Medical Records'),
                h('p', { style: { color: '#64748b', marginTop: '0.25rem' } }, 'View and manage patient records')
            ),
            h('button', {
                style: {
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer'
                }
            }, '+ Upload Record')
        ),

        // Category Filters
        h('div', {
            style: {
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem'
            }
        },
            categories.map(cat =>
                h('button', {
                    key: cat.id,
                    onClick: () => setSelectedCategory(cat.id),
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: selectedCategory === cat.id ? '#1e3a5f' : 'white',
                        color: selectedCategory === cat.id ? 'white' : '#64748b',
                        border: '1px solid #e2e8f0',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: '500'
                    }
                },
                    h('span', null, cat.icon),
                    h('span', null, cat.label),
                    h('span', {
                        style: {
                            padding: '0.125rem 0.5rem',
                            background: selectedCategory === cat.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                            borderRadius: '9999px',
                            fontSize: '0.75rem'
                        }
                    }, cat.count)
                )
            )
        ),

        // Records Grid
        h('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
            }
        },
            filteredRecords.map(record =>
                h('div', {
                    key: record.id,
                    style: {
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    },
                    onMouseEnter: (e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    },
                    onMouseLeave: (e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }
                },
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' } },
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
                            h('span', { style: { fontSize: '1.5rem' } }, typeIcons[record.type] || '📄'),
                            h('div', null,
                                h('p', { style: { margin: 0, fontWeight: '600', color: '#1e3a5f' } }, record.type),
                                h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, record.id)
                            )
                        ),
                        h('span', {
                            style: {
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: statusColors[record.status].bg,
                                color: statusColors[record.status].text
                            }
                        }, record.status)
                    ),
                    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' } },
                        h('div', null,
                            h('p', { style: { margin: 0, color: '#64748b', fontSize: '0.75rem' } }, 'Patient'),
                            h('p', { style: { margin: 0, fontWeight: '500' } }, record.patient)
                        ),
                        h('div', null,
                            h('p', { style: { margin: 0, color: '#64748b', fontSize: '0.75rem' } }, 'Doctor'),
                            h('p', { style: { margin: 0, fontWeight: '500' } }, record.doctor)
                        ),
                        h('div', { style: { gridColumn: 'span 2' } },
                            h('p', { style: { margin: 0, color: '#64748b', fontSize: '0.75rem' } }, 'Date'),
                            h('p', { style: { margin: 0, fontWeight: '500' } }, record.date)
                        )
                    )
                )
            )
        )
    );
}
