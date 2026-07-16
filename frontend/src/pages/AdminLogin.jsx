import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import BrandPanel from '../components/BrandPanel.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/auth/login', { email, password });
      localStorage.setItem('crawlnews_admin_token', data.token);
      localStorage.setItem('crawlnews_admin', JSON.stringify(data.admin));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="split-screen">
      <div className="form-panel">
        <div className="brand">
          <div className="brand-icon">📰</div>
          <div className="brand-name">Crawl<span>News</span></div>
        </div>
        <div className="brand-tagline">DISCOVER NEWS. FASTER. SMARTER.</div>

        <div className="form-card">
          <div className="form-title-row">
            <div className="form-icon-badge">🛡️</div>
            <h1 className="form-title">Administrator Login</h1>
          </div>
          <p className="form-subtitle">Access the secure control panel for CrawlNews system configurations.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="input-toggle" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : <>Login as Administrator →</>}
            </button>
          </form>

          <div className="link-center">
            <Link to="/login" className="link-blue">Back to User Login</Link>
          </div>
        </div>

        <div className="footer-note">© 2026 CrawlNews Inc. All rights reserved.</div>
      </div>

      <BrandPanel />
    </div>
  );
}
