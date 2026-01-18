const { useState, useEffect } = window.React;
const h = window.React.createElement;

export default function Home({ context }) {
    const [hoveredCard, setHoveredCard] = useState(null);

    const styles = {
        container: {
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#f8f9fa',
            color: '#333',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        },
        nav: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 3rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer',
        },
        navLinks: {
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
        },
        navLink: {
            textDecoration: 'none',
            color: '#555',
            fontWeight: '500',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'color 0.3s ease',
        },
        ctaButton: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
            boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)',
        },
        hero: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '6rem 2rem',
            background: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)',
        },
        heroTitle: {
            fontSize: '3.5rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            lineHeight: '1.2',
            color: '#1a202c',
        },
        heroTitleSpan: {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        heroSubtitle: {
            fontSize: '1.25rem',
            color: '#718096',
            maxWidth: '600px',
            marginBottom: '2.5rem',
            lineHeight: '1.6',
        },
        buttonGroup: {
            display: 'flex',
            gap: '1rem',
        },
        secondaryButton: {
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            border: '2px solid #e2e8f0',
            background: 'transparent',
            color: '#4a5568',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        features: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            padding: '4rem 3rem',
            maxWidth: '1200px',
            margin: '0 auto',
        },
        card: (index) => ({
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            padding: '2.5rem',
            borderRadius: '16px',
            boxShadow: hoveredCard === index ? '0 20px 40px rgba(0,0,0,0.12)' : '0 10px 30px rgba(0,0,0,0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            transform: hoveredCard === index ? 'translateY(-10px)' : 'translateY(0)',
            border: '1px solid rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
        }),
        iconWrapper: {
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 10px rgba(102, 126, 234, 0.4)',
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            color: '#2d3748',
        },
        cardText: {
            fontSize: '1rem',
            color: '#718096',
            lineHeight: '1.6',
        },
        footer: {
            marginTop: 'auto',
            padding: '2rem',
            textAlign: 'center',
            color: '#a0aec0',
            fontSize: '0.9rem',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #edf2f7',
        }
    };

    return h('div', { style: styles.container },
        // Navigation
        h('nav', { style: styles.nav },
            h('div', { style: styles.logo }, 'Stellar'),
            h('div', { style: styles.navLinks },
                h('a', { style: styles.navLink }, 'Product'),
                h('a', { style: styles.navLink }, 'Solutions'),
                h('a', { style: styles.navLink }, 'Pricing'),
                h('button', { 
                    style: styles.ctaButton,
                    onMouseEnter: (e) => e.target.style.transform = 'scale(1.05)',
                    onMouseLeave: (e) => e.target.style.transform = 'scale(1)'
                }, 'Get Started')
            )
        ),

        // Hero Section
        h('section', { style: styles.hero },
            h('h1', { style: styles.heroTitle },
                'Build the future with ',
                h('span', { style: styles.heroTitleSpan }, 'modern tools')
            ),
            h('p', { style: styles.heroSubtitle },
                'Empower your team with our cutting-edge platform. Streamline workflows, boost productivity, and scale effortlessly.'
            ),
            h('div', { style: styles.buttonGroup },
                h('button', { 
                    style: styles.ctaButton,
                    onMouseEnter: (e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 6px 20px rgba(118, 75, 162, 0.4)'; },
                    onMouseLeave: (e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 15px rgba(118, 75, 162, 0.3)'; }
                }, 'Start Free Trial'),
                h('button', { 
                    style: styles.secondaryButton,
                    onMouseEnter: (e) => { e.target.style.borderColor = '#667eea'; e.target.style.color = '#667eea'; },
                    onMouseLeave: (e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#4a5568'; }
                }, 'Learn More')
            )
        ),

        // Features Section
        h('section', { style: styles.features },
            h('div', { 
                style: styles.card(0), 
                onMouseEnter: () => setHoveredCard(0),
                onMouseLeave: () => setHoveredCard(null)
            },
                h('div', { style: styles.iconWrapper }, '🚀'),
                h('h3', { style: styles.cardTitle }, 'Lightning Fast'),
                h('p', { style: styles.cardText }, 'Optimized for speed and performance. Your data is delivered in milliseconds, ensuring a seamless experience.')
            ),
            h('div', { 
                style: styles.card(1), 
                onMouseEnter: () => setHoveredCard(1),
                onMouseLeave: () => setHoveredCard(null)
            },
                h('div', { style: { ...styles.iconWrapper, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', boxShadow: '0 4px 10px rgba(240, 147, 251, 0.4)' } }, '🔒'),
                h('h3', { style: styles.cardTitle }, 'Secure by Design'),
                h('p', { style: styles.cardText }, 'Enterprise-grade security built into every layer. We protect your data with the highest standards.')
            ),
            h('div', { 
                style: styles.card(2), 
                onMouseEnter: () => setHoveredCard(2),
                onMouseLeave: () => setHoveredCard(null)
            },
                h('div', { style: { ...styles.iconWrapper, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', boxShadow: '0 4px 10px rgba(79, 172, 254, 0.4)' } }, '⚙️'),
                h('h3', { style: styles.cardTitle }, 'Easy Integration'),
                h('p', { style: styles.cardText }, 'Connect with your favorite tools instantly. Our API is designed for developers to love.')
            )
        ),

        // Footer
        h('footer', { style: styles.footer },
            '© 2023 Stellar Inc. All rights reserved.'
        )
    );
}