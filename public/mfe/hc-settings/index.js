/**
 * Healthcare Settings MFE
 * Application and user settings
 */
const { useState } = window.React;
const h = window.React.createElement;

export default function Settings({ context }) {
    const [activeTab, setActiveTab] = useState('profile');

    const [profile, setProfile] = useState({
        name: 'Dr. Sarah Smith',
        email: 'sarah.smith@medicare.com',
        phone: '(555) 123-4567',
        department: 'General Medicine',
        license: 'MD-12345-CA',
        specialization: 'Internal Medicine'
    });

    const [notifications, setNotifications] = useState({
        appointments: true,
        messages: true,
        reports: true,
        reminders: false,
        marketing: false
    });

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'billing', label: 'Billing', icon: '💳' },
        { id: 'integrations', label: 'Integrations', icon: '🔗' }
    ];

    const Toggle = ({ checked, onChange }) => h('button', {
        onClick: () => onChange(!checked),
        style: {
            width: '48px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: checked ? '#10b981' : '#e2e8f0',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s'
        }
    },
        h('span', {
            style: {
                position: 'absolute',
                top: '2px',
                left: checked ? '26px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s'
            }
        })
    );

    return h('div', { style: { padding: '0.5rem' } },
        // Header
        h('div', { style: { marginBottom: '1.5rem' } },
            h('h1', { style: { fontSize: '1.75rem', fontWeight: '700', color: '#1e3a5f', margin: 0 } }, 'Settings'),
            h('p', { style: { color: '#64748b', marginTop: '0.25rem' } }, 'Manage your account and preferences')
        ),

        // Layout
        h('div', { style: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' } },
            // Sidebar Tabs
            h('div', {
                style: {
                    background: 'white',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    height: 'fit-content'
                }
            },
                tabs.map(tab =>
                    h('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.875rem 1rem',
                            background: activeTab === tab.id ? '#f0f4f8' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            color: activeTab === tab.id ? '#1e3a5f' : '#64748b',
                            textAlign: 'left'
                        }
                    },
                        h('span', null, tab.icon),
                        h('span', null, tab.label)
                    )
                )
            ),

            // Content
            h('div', {
                style: {
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }
            },
                activeTab === 'profile' && h('div', null,
                    h('h2', { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '1.5rem' } }, 'Profile Information'),

                    // Avatar
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' } },
                        h('div', {
                            style: {
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.75rem',
                                fontWeight: '600'
                            }
                        }, 'SS'),
                        h('div', null,
                            h('button', {
                                style: {
                                    padding: '0.5rem 1rem',
                                    background: '#1e3a5f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    marginRight: '0.5rem'
                                }
                            }, 'Upload Photo'),
                            h('button', {
                                style: {
                                    padding: '0.5rem 1rem',
                                    background: 'white',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }
                            }, 'Remove')
                        )
                    ),

                    // Form
                    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' } },
                        Object.entries(profile).map(([key, value]) =>
                            h('div', { key },
                                h('label', {
                                    style: {
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '0.5rem',
                                        textTransform: 'capitalize'
                                    }
                                }, key.replace(/([A-Z])/g, ' $1')),
                                h('input', {
                                    type: 'text',
                                    value: value,
                                    onChange: (e) => setProfile({ ...profile, [key]: e.target.value }),
                                    style: {
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }
                                })
                            )
                        )
                    ),

                    h('div', { style: { marginTop: '2rem', display: 'flex', gap: '1rem' } },
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
                        }, 'Save Changes'),
                        h('button', {
                            style: {
                                padding: '0.75rem 1.5rem',
                                background: 'white',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }
                        }, 'Cancel')
                    )
                ),

                activeTab === 'notifications' && h('div', null,
                    h('h2', { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '1.5rem' } }, 'Notification Preferences'),

                    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
                        Object.entries(notifications).map(([key, value]) =>
                            h('div', {
                                key,
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px'
                                }
                            },
                                h('div', null,
                                    h('p', { style: { margin: 0, fontWeight: '500', textTransform: 'capitalize' } }, key),
                                    h('p', { style: { margin: 0, fontSize: '0.75rem', color: '#64748b' } }, `Receive ${key} notifications`)
                                ),
                                h(Toggle, {
                                    checked: value,
                                    onChange: (v) => setNotifications({ ...notifications, [key]: v })
                                })
                            )
                        )
                    )
                ),

                activeTab === 'security' && h('div', null,
                    h('h2', { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '1.5rem' } }, 'Security Settings'),
                    h('p', { style: { color: '#64748b' } }, 'Manage your password and security preferences.')
                ),

                activeTab === 'billing' && h('div', null,
                    h('h2', { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '1.5rem' } }, 'Billing & Subscription'),
                    h('p', { style: { color: '#64748b' } }, 'Manage your subscription and payment methods.')
                ),

                activeTab === 'integrations' && h('div', null,
                    h('h2', { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '1.5rem' } }, 'Connected Apps'),
                    h('p', { style: { color: '#64748b' } }, 'Manage third-party integrations and connected services.')
                )
            )
        )
    );
}
