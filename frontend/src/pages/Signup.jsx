import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import BrandPanel from '../components/BrandPanel.jsx';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      // Map our backend's simple category array to what Signup.jsx expects
      const cats = data.map(c => ({ id: c.category, name: c.category, slug: c.category }));
      setCategories(cats);
    }).catch(() => {});
  }, []);

  function toggleInterest(id) {
    setSelectedInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name, email, password, interests: selectedInterests
      });
      setSuccess('Account created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
            <div className="form-icon-badge">✨</div>
            <h1 className="form-title">Create Account</h1>
          </div>
          <p className="form-subtitle">Pick a few interests so we can personalize your feed from day one.</p>

          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-icon">🧑</span>
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              {categories.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Your interests</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleInterest(c.id)}
                        className={`category-pill ${selectedInterests.includes(c.id) ? 'active' : ''}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up →'}
              </button>
            </form>
          )}

          <div className="link-center">
            Already have an account? <Link to="/login" className="link-blue">Log in</Link>
          </div>
        </div>

        <div className="footer-note">© 2026 CrawlNews Inc. All rights reserved.</div>
      </div>

      <BrandPanel />
    </div>
  );
}
