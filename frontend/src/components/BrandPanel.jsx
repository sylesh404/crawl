import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Database, Globe as GlobeIcon, Shield, Users, Clock, Flame, Brain, Cpu, Zap, Activity } from 'lucide-react';

const Globe = lazy(() => import('./ui/Globe'));

// Content pools for each of the 6 card positions
const CARD_POOLS = {
  headlines: [
    {
      icon: <Clock className="w-4 h-4 text-red-600" />,
      category: 'Headlines',
      title: 'Autonomous Logistics',
      desc: 'Major urban centers transition cargo fleets to L5 automation.',
      badge: 'Tech',
      time: '1h ago',
      sparkline: [60, 58, 55, 62, 70, 68, 75],
    },
    {
      icon: <Clock className="w-4 h-4 text-red-600" />,
      category: 'Headlines',
      title: 'Carbon Capture Goal',
      desc: 'Direct-air extraction facilities exceed carbon removal targets.',
      badge: 'Climate',
      time: '2h ago',
      sparkline: [40, 48, 52, 60, 55, 65, 78],
    },
    {
      icon: <Clock className="w-4 h-4 text-red-600" />,
      category: 'Headlines',
      title: 'Deep Ocean Probe',
      desc: 'Sub-sea exploration robot discovers thermal microbial colony.',
      badge: 'Science',
      time: '3h ago',
      sparkline: [50, 45, 48, 52, 58, 62, 60],
    }
  ],
  energy: [
    {
      icon: <Zap className="w-4 h-4 text-yellow-600" />,
      category: 'Global Energy',
      title: 'Fusion Grid Net-Gain',
      desc: 'First commercial tokamak reactor connects to main power line.',
      badge: 'Stable',
      time: '12m ago',
      sparkline: [50, 55, 52, 58, 65, 70, 72],
    },
    {
      icon: <Zap className="w-4 h-4 text-yellow-600" />,
      category: 'Global Energy',
      title: 'Solar Sails Deployed',
      desc: 'Orbiting solar arrays achieve record generation efficiency.',
      badge: 'Generating',
      time: '30m ago',
      sparkline: [30, 38, 42, 45, 50, 58, 64],
    },
    {
      icon: <Zap className="w-4 h-4 text-yellow-600" />,
      category: 'Global Energy',
      title: 'Solid State Batteries',
      desc: 'Industrial gigafactory ships sodium solid-state electrolytes.',
      badge: 'Battery',
      time: '45m ago',
      sparkline: [45, 52, 48, 55, 60, 62, 68],
    }
  ],
  world: [
    {
      icon: <GlobeIcon className="w-4 h-4 text-green-600" />,
      category: 'World News',
      title: 'Realtime Feeds',
      desc: 'Aggregating raw feeds from 154 country portals.',
      badge: 'Global',
      time: '3s ago',
      sparkline: [20, 25, 40, 30, 50, 45, 65],
    },
    {
      icon: <GlobeIcon className="w-4 h-4 text-green-600" />,
      category: 'World News',
      title: 'Customs Agreement',
      desc: 'Smart contract protocols automate global customs declarations.',
      badge: 'Trade',
      time: '10s ago',
      sparkline: [15, 22, 28, 25, 32, 40, 48],
    },
    {
      icon: <GlobeIcon className="w-4 h-4 text-green-600" />,
      category: 'World News',
      title: 'Relief Cargo Dispatched',
      desc: 'Disaster response system deploys medical supply drones.',
      badge: 'Aid',
      time: '1m ago',
      sparkline: [35, 40, 38, 45, 42, 50, 52],
    }
  ],
  markets: [
    {
      icon: <Activity className="w-4 h-4 text-purple-600" />,
      category: 'Markets',
      title: 'Tech Index Surges',
      desc: 'AI hardware and semiconductor producers jump +4.2%.',
      badge: '+4.2%',
      time: '5m ago',
      sparkline: [40, 35, 45, 55, 50, 68, 74],
    },
    {
      icon: <Activity className="w-4 h-4 text-purple-600" />,
      category: 'Markets',
      title: 'Bond Yield Stabilizes',
      desc: 'Treasury yields retract as macroeconomic liquidity improves.',
      badge: 'Macro',
      time: '15m ago',
      sparkline: [62, 58, 55, 52, 50, 48, 45],
    },
    {
      icon: <Activity className="w-4 h-4 text-purple-600" />,
      category: 'Markets',
      title: 'Commodity Index Up',
      desc: 'Synthetic fuel commodity contracts rise +1.8% daily.',
      badge: 'Commodity',
      time: '20m ago',
      sparkline: [28, 30, 35, 33, 40, 42, 46],
    }
  ],
  ai: [
    {
      icon: <Brain className="w-4 h-4 text-blue-600" />,
      category: 'AI Summary',
      title: 'GPT-6 Architecture',
      desc: 'Neural capacity scales 10x with multi-modal MoE routing.',
      badge: '98% Match',
      time: 'Just now',
      sparkline: [30, 45, 35, 60, 50, 75, 70],
    },
    {
      icon: <Brain className="w-4 h-4 text-blue-600" />,
      category: 'AI Summary',
      title: 'Telemetry Interfaces',
      desc: 'High-bandwidth motor telemetry decodes cortical signals.',
      badge: '97% Match',
      time: '1m ago',
      sparkline: [25, 32, 40, 38, 50, 62, 70],
    },
    {
      icon: <Brain className="w-4 h-4 text-blue-600" />,
      category: 'AI Summary',
      title: 'Agentic Automations',
      desc: 'Distributed agent network handles 80% of logistics workflows.',
      badge: '99% Match',
      time: '3m ago',
      sparkline: [60, 62, 65, 70, 78, 80, 85],
    }
  ],
  personalized: [
    {
      icon: <Cpu className="w-4 h-4 text-cyan-600" />,
      category: 'For You',
      title: 'Personalized Digest',
      desc: 'Curated 14 articles matching user interest profile.',
      badge: '99% Match',
      time: '10s ago',
      sparkline: [30, 40, 50, 45, 60, 55, 80],
    },
    {
      icon: <Cpu className="w-4 h-4 text-cyan-600" />,
      category: 'For You',
      title: 'Interest Graph Sync',
      desc: 'Fusion energy and quantum computing links synced.',
      badge: 'Synced',
      time: '2m ago',
      sparkline: [20, 28, 25, 35, 42, 50, 55],
    },
    {
      icon: <Cpu className="w-4 h-4 text-cyan-600" />,
      category: 'For You',
      title: 'Reading Queue Addition',
      desc: 'Full analysis of fusion economic vectors added to queue.',
      badge: 'Queue',
      time: '5m ago',
      sparkline: [45, 48, 52, 50, 58, 64, 68],
    }
  ]
};

export default function BrandPanel() {
  // Pool indices for [headlines, energy, world, markets, ai, personalized]
  const [poolIndices, setPoolIndices] = useState([0, 0, 0, 0, 0, 0]);
  const [fadingSlots, setFadingSlots] = useState([false, false, false, false, false, false]);

  // Live counters state
  const [articlesToday, setArticlesToday] = useState(23840);
  const [activeReaders, setActiveReaders] = useState(14120);
  const [accuracy, setAccuracy] = useState(99.1);

  // Slow count-up animations to make the dashboard feel live
  useEffect(() => {
    const articleInterval = setInterval(() => {
      setArticlesToday((a) => a + Math.floor(Math.random() * 3 + 1));
    }, 1800);

    const readersInterval = setInterval(() => {
      setActiveReaders((r) => r + Math.floor(Math.random() * 5 - 2));
    }, 2500);

    const accuracyInterval = setInterval(() => {
      setAccuracy((acc) => {
        const next = acc + (Math.random() * 0.04 - 0.02);
        return Math.max(99.0, Math.min(99.9, parseFloat(next.toFixed(2))));
      });
    }, 4000);

    return () => {
      clearInterval(articleInterval);
      clearInterval(readersInterval);
      clearInterval(accuracyInterval);
    };
  }, []);

  // Card Content Rotation Queue (rotates one card position at a time)
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      const slotToRotate = Math.floor(Math.random() * 6);

      // Start fade out
      setFadingSlots((prev) => {
        const next = [...prev];
        next[slotToRotate] = true;
        return next;
      });

      // Update index in pool
      setTimeout(() => {
        setPoolIndices((prev) => {
          const next = [...prev];
          next[slotToRotate] = (next[slotToRotate] + 1) % 3; // 3 items in each pool
          return next;
        });

        // Fade back in
        setTimeout(() => {
          setFadingSlots((prev) => {
            const next = [...prev];
            next[slotToRotate] = false;
            return next;
          });
        }, 50);
      }, 400);
    }, 4500);

    return () => clearInterval(rotateInterval);
  }, [poolIndices]);

  // SVG Sparkline path generator
  const generateSparklinePath = (data) => {
    if (!data || data.length === 0) return '';
    const width = 100;
    const height = 18;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    
    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  // Helper to get card properties based on position index
  const getCardData = (index) => {
    const keys = ['headlines', 'energy', 'world', 'markets', 'ai', 'personalized'];
    const key = keys[index];
    const poolIdx = poolIndices[index];
    return {
      card: CARD_POOLS[key][poolIdx],
      className: `floating-card pos-${key}`,
    };
  };

  return (
    <div className="visual-panel-inner">
      {/* 1. Dashboard Heading / Subheading */}
      <div className="dashboard-header-container">
        <h2 className="dashboard-title">NEWS INTELLIGENCE</h2>
        <div className="dashboard-subheading">
          <span className="live-pulse-dot"></span>
          <span>LIVE GLOBAL FEEDS</span>
        </div>
      </div>

      {/* 2. Central Visual Globe Stage */}
      <div className="globe-stage-wrapper">
        <Suspense fallback={<div className="globe-loading-placeholder">Loading 3D Visualizer...</div>}>
          <Globe />
        </Suspense>
      </div>

      {/* 3. Six Floating Glassmorphism Cards positioned without overlaps */}
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const { card, className } = getCardData(index);
        const isFading = fadingSlots[index];

        return (
          <div 
            key={index} 
            className={`${className} ${isFading ? 'fade-out' : 'fade-in'}`}
          >
            <div className="card-header-row">
              <span className="card-icon">{card.icon}</span>
              <span className="card-badge-label">{card.category}</span>
              {card.badge && (
                <span className="card-status-pill">{card.badge}</span>
              )}
            </div>
            <h4 className="floating-card-title">{card.title}</h4>
            <p className="floating-card-desc">{card.desc}</p>
            
            {/* Sparkline Graph */}
            {card.sparkline && (
              <div className="card-sparkline-wrap">
                <svg className="sparkline-svg" viewBox="0 0 100 18">
                  <path
                    d={generateSparklinePath(card.sparkline)}
                    fill="none"
                    stroke="rgba(37, 99, 235, 0.45)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            
            <div className="card-footer-row">
              <span className="card-footer-text">{card.time || 'Updated'}</span>
            </div>
          </div>
        );
      })}

      {/* 4. One Clean Horizontal Analytics Strip (Five Columns) */}
      <div className="bottom-analytics-strip">
        <div className="analytics-item">
          <Database className="w-4 h-4 icon-color" />
          <div className="analytics-info">
            <span className="analytics-label">Articles Today</span>
            <div className="analytics-num-container">
              <span className="analytics-value">{articlesToday.toLocaleString()}</span>
              <span className="analytics-trend">+3.4%</span>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <GlobeIcon className="w-4 h-4 icon-color" />
          <div className="analytics-info">
            <span className="analytics-label">Countries Covered</span>
            <div className="analytics-num-container">
              <span className="analytics-value">154</span>
              <span className="analytics-status-dot"></span>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <Clock className="w-4 h-4 icon-color" />
          <div className="analytics-info">
            <span className="analytics-label">Avg Update Speed</span>
            <div className="analytics-num-container">
              <span className="analytics-value">1.2s</span>
              <span className="analytics-check">✓</span>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <Users className="w-4 h-4 icon-color" />
          <div className="analytics-info">
            <span className="analytics-label">Active Readers</span>
            <div className="analytics-num-container">
              <span className="analytics-value">{activeReaders.toLocaleString()}</span>
              <span className="analytics-pulse-dot"></span>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <Shield className="w-4 h-4 icon-color" />
          <div className="analytics-info">
            <span className="analytics-label">AI Accuracy</span>
            <div className="analytics-num-container">
              <span className="analytics-value">{accuracy}%</span>
              <span className="analytics-status-dot"></span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Horizontal news ticker activity strip */}
      <div className="news-ticker-container">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            <span className="ticker-badge">LIVE FEED</span>
            <span className="ticker-text">• Breaking News • AI Revolution • Global Markets • Technology • Business • Economy • Sports • Energy</span>
            <span className="ticker-badge">LIVE FEED</span>
            <span className="ticker-text">• Breaking News • AI Revolution • Global Markets • Technology • Business • Economy • Sports • Energy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
