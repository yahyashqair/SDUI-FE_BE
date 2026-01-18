const { useState, useEffect } = window.React;
const h = window.React.createElement;

export default function AboutUs({ context }) {
  const team = [
    { name: "Sarah Jenkins", role: "CEO & Founder", color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { name: "Michael Chen", role: "CTO", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { name: "Emily Ross", role: "Head of Design", color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
    { name: "David Kim", role: "Lead Engineer", color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }
  ];

  const stats = [
    { label: "Years Active", value: "10+" },
    { label: "Projects Delivered", value: "500+" },
    { label: "Happy Clients", value: "98%" }
  ];

  const styles = {
    container: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#333',
      lineHeight: '1.6',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    },
    hero: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '5rem 1rem',
      textAlign: 'center',
      marginBottom: '3rem'
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: '800',
      margin: '0 0 1rem 0',
      letterSpacing: '-0.05rem'
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      opacity: 0.9,
      maxWidth: '600px',
      margin: '0 auto'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1.5rem 4rem 1.5rem'
    },
    sectionTitle: {
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '3rem',
      color: '#2d3748'
    },
    missionCard: {
      background: 'white',
      padding: '3rem',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      textAlign: 'center',
      marginBottom: '4rem'
    },
    missionText: {
      fontSize: '1.1rem',
      color: '#4a5568',
      maxWidth: '800px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      marginBottom: '4rem'
    },
    statCard: {
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease'
    },
    statValue: {
      display: 'block',
      fontSize: '2.5rem',
      fontWeight: '800',
      color: '#667eea',
      marginBottom: '0.5rem'
    },
    statLabel: {
      color: '#718096',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontSize: '0.85rem'
    },
    teamCard: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'default'
    },
    teamHeader: {
      height: '120px',
      width: '100%'
    },
    teamBody: {
      padding: '1.5rem',
      textAlign: 'center'
    },
    teamName: {
      margin: '0',
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#2d3748'
    },
    teamRole: {
      margin: '0.5rem 0 0 0',
      color: '#718096',
      fontSize: '0.9rem'
    },
    footer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#718096',
      borderTop: '1px solid #e2e8f0'
    }
  };

  return h('div', { style: styles.container },
    h('header', { style: styles.hero },
      h('h1', { style: styles.heroTitle }, 'About Us'),
      h('p', { style: styles.heroSubtitle }, 'We are a team of passionate creators dedicated to delivering exceptional digital experiences that drive growth and innovation.')
    ),

    h('main', { style: styles.content },
      
      // Mission Section
      h('section', null,
        h('div', { style: styles.missionCard },
          h('h2', { style: styles.sectionTitle }, 'Our Mission'),
          h('p', { style: styles.missionText }, 
            "To bridge the gap between complex technology and human potential. We believe that great software isn't just about code—it's about understanding people, solving real problems, and creating intuitive solutions that make life better. Every day, we strive to push the boundaries of what's possible while maintaining a relentless focus on quality and user experience."
          )
        )
      ),

      // Stats Section
      h('section', null,
        h('div', { style: styles.grid },
          stats.map((stat, index) => 
            h('div', { 
              key: index, 
              style: styles.statCard,
              onMouseEnter: (e) => e.currentTarget.style.transform = 'translateY(-5px)',
              onMouseLeave: (e) => e.currentTarget.style.transform = 'translateY(0)'
            },
              h('span', { style: styles.statValue }, stat.value),
              h('span', { style: styles.statLabel }, stat.label)
            )
          )
        )
      ),

      // Team Section
      h('section', null,
        h('h2', { style: styles.sectionTitle }, 'Meet The Team'),
        h('div', { style: styles.grid },
          team.map((member, index) => 
            h('div', { 
              key: index, 
              style: styles.teamCard,
              onMouseEnter: (e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
              }
            },
              h('div', { style: { ...styles.teamHeader, background: member.color } }),
              h('div', { style: styles.teamBody },
                h('h3', { style: styles.teamName }, member.name),
                h('p', { style: styles.teamRole }, member.role)
              )
            )
          )
        )
      )
    ),

    h('footer', { style: styles.footer },
      h('p', null, '© 2023 Our Company. All rights reserved.')
    )
  );
}