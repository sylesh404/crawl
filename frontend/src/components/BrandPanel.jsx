import React, { Suspense, lazy } from 'react';

const Globe = lazy(() => import('./ui/Globe'));

export default function BrandPanel() {
  const cards = [
    {
      id: 'breaking-news',
      className: 'floating-card pos-top-left',
      icon: '🔴',
      category: 'LIVE',
      title: 'Global Energy Grid',
      desc: 'Transitions to Fusion Power',
      badge: 'LIVE',
      footer: 'Just now',
    },
    {
      id: 'ai-summary',
      className: 'floating-card pos-top-center',
      icon: '🤖',
      category: 'AI Summary',
      title: 'GPT-6 Architecture',
      desc: 'Neural connections scale 10x',
      badge: '98% Match',
      footer: 'Updated',
    },
    {
      id: 'trending-topics',
      className: 'floating-card pos-top-right',
      icon: '🔥',
      category: 'Trending',
      title: '#Technology',
      desc: '#AI, #Quantum, #Computing',
      badge: 'Hot',
      footer: '12.4k posts',
    },
    {
      id: 'world-news',
      className: 'floating-card pos-middle-left',
      icon: '🌍',
      category: 'World News',
      title: 'Realtime Feeds',
      desc: 'Aggregating 150+ countries',
      badge: 'Global',
      footer: '3s ago',
    },
    {
      id: 'markets-update',
      className: 'floating-card pos-middle-right',
      icon: '📈',
      category: 'Markets',
      title: 'Tech Index Soars',
      desc: 'Semiconductors gain +4.2%',
      badge: '+4.2%',
      footer: 'NYSE Open',
    },
    {
      id: 'todays-headlines',
      className: 'floating-card pos-bottom-left',
      icon: '📰',
      category: 'Headlines',
      title: 'Quantum Qubits',
      desc: 'First commercial array online',
      badge: 'Tech',
      footer: '1h ago',
    },
    {
      id: 'personalized-feed',
      className: 'floating-card pos-bottom-right',
      icon: '✨',
      category: 'For You',
      title: 'Customized Digest',
      desc: 'Curated based on interests',
      badge: '99.4% Match',
      footer: 'Tailored',
    },
  ];

  return (
    <div className="visual-panel-inner" style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* SVG Orbits background behind the globe and cards */}
      <svg className="orbital-lines-svg" viewBox="0 0 800 800" fill="none">
        <defs>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbit Path 1 (Inner) */}
        <circle cx="400" cy="400" r="170" stroke="rgba(59, 130, 246, 0.13)" strokeWidth="1" />
        <circle r="4" fill="#3B82F6" filter="url(#node-glow)">
          <animateMotion dur="25s" repeatCount="indefinite" path="M 400, 400 m -170, 0 a 170,170 0 1,0 340,0 a 170,170 0 1,0 -340,0" />
        </circle>

        {/* Orbit Path 2 (Middle) */}
        <circle cx="400" cy="400" r="250" stroke="rgba(59, 130, 246, 0.10)" strokeWidth="1" strokeDasharray="4 4" />
        <circle r="5" fill="#60A5FA" filter="url(#node-glow)">
          <animateMotion dur="38s" repeatCount="indefinite" path="M 400, 400 m -250, 0 a 250,250 0 1,0 500,0 a 250,250 0 1,0 -500,0" />
        </circle>

        {/* Orbit Path 3 (Outer) */}
        <circle cx="400" cy="400" r="330" stroke="rgba(59, 130, 246, 0.07)" strokeWidth="1" />
        <circle r="4.5" fill="#93C5FD" filter="url(#node-glow)">
          <animateMotion dur="50s" repeatCount="indefinite" path="M 400, 400 m -330, 0 a 330,330 0 1,0 660,0 a 330,330 0 1,0 -660,0" />
        </circle>
      </svg>

      {/* Rotating Globe Centerstage */}
      <div className="globe-stage-wrapper">
        <Suspense fallback={<div className="globe-loading-placeholder">Loading 3D Visualizer...</div>}>
          <Globe />
        </Suspense>
      </div>

      {/* Floating Glassmorphism Cards */}
      {cards.map((card) => (
        <div key={card.id} className={card.className}>
          <div className="card-header-row">
            <span className="card-icon">{card.icon}</span>
            <span className="card-badge-label">{card.category}</span>
            {card.badge && <span className="card-status-pill">{card.badge}</span>}
          </div>
          <h4 className="floating-card-title">{card.title}</h4>
          <p className="floating-card-desc">{card.desc}</p>
          <div className="card-footer-row">
            <span className="card-footer-text">{card.footer}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
