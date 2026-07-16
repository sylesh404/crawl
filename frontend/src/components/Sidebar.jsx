import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut, Home, Globe, Bookmark, Folder, Compass, Sun, Moon, Newspaper } from 'lucide-react';

export default function Sidebar({ onLanguagesClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const userJson = localStorage.getItem('crawlnews_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isGuest = !user || user.isGuest;

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('crawlnews_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('crawlnews_dark_mode', darkMode);
  }, [darkMode]);

  const handleProfileClick = () => {
    setIsOpen(false);
    setModalContent({
      title: 'Profile settings',
      message: 'Profile settings are only editable for premium accounts.'
    });
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    setModalContent({
      title: 'Settings locked',
      message: 'Settings control panel is currently locked for premium users.'
    });
  };

  const handleLogout = () => {
    setIsOpen(false);
    localStorage.removeItem('crawlnews_user_token');
    localStorage.removeItem('crawlnews_user');
    navigate('/login');
  };

  return (
    <>
      {/* Floating Hamburger toggle button (visible on tablet/mobile) */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000
        }}
        aria-label="Open Sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop overlay */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button inside drawer */}
        <button 
          className="sidebar-close-btn" 
          onClick={() => setIsOpen(false)}
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>

        <div className="brand-name" onClick={() => { setIsOpen(false); navigate('/home'); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <Newspaper size={18} color="white" />
          </div>
          Crawl<span style={{ color: 'var(--blue)' }}>News</span>
        </div>

        <div className="nav-section-label">Feed</div>
        
        <Link to="/home" className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
          <Home size={16} /> For You
        </Link>
        
        <button 
          onClick={() => { setIsOpen(false); onLanguagesClick?.(); }} 
          className="nav-item sidebar-btn"
          style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <Globe size={16} /> Languages
        </button>

        {!isGuest && (
          <Link to="/saved" className={`nav-item ${location.pathname === '/saved' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
            <Bookmark size={16} /> Saved Articles
          </Link>
        )}

        <div className="nav-item clickable-section" onClick={() => { setIsOpen(false); navigate('/home'); }}>
          <Folder size={16} /> Categories
        </div>

        <div className="nav-item clickable-section" onClick={() => { setIsOpen(false); navigate('/home'); }}>
          <Compass size={16} /> Explore
        </div>

        <div className="nav-section-label">Account</div>

        <button 
          onClick={handleProfileClick} 
          className="nav-item sidebar-btn"
          style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <User size={16} /> Profile
        </button>

        <button 
          onClick={handleSettingsClick} 
          className="nav-item sidebar-btn"
          style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <Settings size={16} /> Settings
        </button>

        {!isGuest && (
          <button 
            onClick={handleLogout} 
            className="nav-item sidebar-btn"
            style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#ef4444' }}
          >
            <LogOut size={16} /> Logout
          </button>
        )}

        {/* Guest personalization card */}
        {isGuest && (
          <div className="personalize-card">
            <h4>Personalize Your Feed</h4>
            <p>Sign in to save articles, follow topics and receive recommendations.</p>
            <button className="personalize-cta-btn" onClick={() => { setIsOpen(false); navigate('/login'); }}>
              Sign In / Login
            </button>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <div className="sidebar-darkmode-toggle">
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {darkMode ? <Moon size={16} /> : <Sun size={16} />} Theme
          </span>
          <button 
            className={`theme-switch ${darkMode ? 'dark' : ''}`} 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
          >
            <div className="theme-switch-thumb" />
          </button>
        </div>
      </div>

      {modalContent && (
        <div className="modal-backdrop" onClick={() => setModalContent(null)} style={{ zIndex: 11000 }}>
          <div className="languages-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
            <h2>{modalContent.title}</h2>
            <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>{modalContent.message}</p>
            <div className="modal-actions" style={{ width: '100%', marginTop: '10px' }}>
              <button className="modal-btn-continue" onClick={() => setModalContent(null)} style={{ width: '100%' }}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
