/**
 * Healthcare Patients MFE
 * Patient list with search and filtering
 */
const { useState } = window.React;
const h = window.React.createElement;

export default function Patients({ context }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients] = useState([
        { id: 'P001', name: 'John Smith', age: 45, gender: 'Male', phone: '(555) 123-4567', condition: 'Hypertension', status: 'Active', lastVisit: '2024-01-15' },
        { id: 'P002', name: 'Emma Wilson', age: 32, gender: 'Female', phone: '(555) 234-5678', condition: 'Diabetes Type 2', status: 'Active', lastVisit: '2024-01-14' },
        { id: 'P003', name: 'Michael Brown', age: 58, gender: 'Male', phone: '(555) 345-6789', condition: 'Arthritis', status: 'Active', lastVisit: '2024-01-12' },
        { id: 'P004', name: 'Sarah Davis', age: 28, gender: 'Female', phone: '(555) 456-7890', condition: 'Pregnancy', status: 'Active', lastVisit: '2024-01-10' },
        { id: 'P005', name: 'James Johnson', age: 67, gender: 'Male', phone: '(555) 567-8901', condition: 'Heart Disease', status: 'Critical', lastVisit: '2024-01-16' },
        { id: 'P006', name: 'Lisa Anderson', age: 41, gender: 'Female', phone: '(555) 678-9012', condition: 'Asthma', status: 'Active', lastVisit: '2024-01-08' },
        { id: 'P007', name: 'Robert Taylor', age: 53, gender: 'Male', phone: '(555) 789-0123', condition: 'Back Pain', status: 'Inactive', lastVisit: '2023-12-20' },
        { id: 'P008', name: 'Jennifer Martinez', age: 35, gender: 'Female', phone: '(555) 890-1234', condition: 'Migraine', status: 'Active', lastVisit: '2024-01-11' },
    ]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColors = {
        'Active': { bg: '#dcfce7', text: '#166534' },
        'Critical': { bg: '#fee2e2', text: '#991b1b' },
        'Inactive': { bg: '#f3f4f6', text: '#6b7280' }
    };

    return h('div', { style: { padding: '0.5rem' } },
        // Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } },
            h('div', null,
                h('h1', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e3a5f', margin: 0 } }, 'Patients'),
                h('p', { style: { color: '#64748b', marginTop: '0.25rem' } }, `${patients.length} total patients`)
            ),
            h('button', {
                style: {
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }
            }, '+ Add Patient')
        ),

        // Search & Filters
        h('div', {
            style: {
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                background: 'white',
                padding: '1rem',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }
        },
            h('input', {
                type: 'text',
                placeholder: 'Search patients by name, ID, or condition...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                style: {
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                }
            }),
            h('select', {
                style: {
                    padding: '0.75rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    background: 'white'
                }
            },
                h('option', null, 'All Status'),
                h('option', null, 'Active'),
                h('option', null, 'Critical'),
                h('option', null, 'Inactive')
            )
        ),

        // Patient Table
        h('div', {
            style: {
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }
        },
            h('table', { style: { width: '100%', borderCollapse: 'collapse' } },
                h('thead', null,
                    h('tr', { style: { background: '#f8fafc' } },
                        ['ID', 'Patient', 'Age', 'Gender', 'Phone', 'Condition', 'Status', 'Last Visit'].map(header =>
                            h('th', {
                                key: header,
                                style: {
                                    padding: '1rem',
                                    textAlign: 'left',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }
                            }, header)
                        )
                    )
                ),
                h('tbody', null,
                    filteredPatients.map(patient =>
                        h('tr', {
                            key: patient.id,
                            style: { borderTop: '1px solid #e2e8f0', cursor: 'pointer' },
                            onMouseEnter: (e) => e.currentTarget.style.background = '#f8fafc',
                            onMouseLeave: (e) => e.currentTarget.style.background = 'white'
                        },
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: '500' } }, patient.id),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', fontWeight: '500' } }, patient.name),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', color: '#64748b' } }, patient.age),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', color: '#64748b' } }, patient.gender),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', color: '#64748b' } }, patient.phone),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem' } }, patient.condition),
                            h('td', { style: { padding: '1rem' } },
                                h('span', {
                                    style: {
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        background: statusColors[patient.status].bg,
                                        color: statusColors[patient.status].text
                                    }
                                }, patient.status)
                            ),
                            h('td', { style: { padding: '1rem', fontSize: '0.875rem', color: '#64748b' } }, patient.lastVisit)
                        )
                    )
                )
            )
        )
    );
}
