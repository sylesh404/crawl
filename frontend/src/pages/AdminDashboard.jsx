import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const TABS = [
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'needs_rephrase', label: 'Needs Rephrase' }
];

function credibilityBadgeClass(score) {
  if (score == null) return 'credibility-med';
  if (score >= 0.75) return 'credibility-high';
  if (score >= 0.5) return 'credibility-med';
  return 'credibility-low';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [crawlMessage, setCrawlMessage] = useState('');
  const navigate = useNavigate();

  const adminJson = localStorage.getItem('crawlnews_admin');
  const admin = adminJson ? JSON.parse(adminJson) : null;

  function logout() {
    localStorage.removeItem('crawlnews_admin_token');
    localStorage.removeItem('crawlnews_admin');
    navigate('/admin');
  }

  function loadStats() {
    api.get('/admin/dashboard/stats').then(({ data }) => setStats(data)).catch(() => {});
  }

  function loadArticles() {
    setLoading(true);
    api.get(`/admin/articles?status=${activeTab}`)
      .then(({ data }) => setArticles(data.articles))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadArticles(); }, [activeTab]);

  async function handleApprove(id) {
    setActionLoadingId(id);
    try {
      await api.post(`/admin/articles/${id}/approve`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } finally { setActionLoadingId(null); }
  }

  async function handleReject(id) {
    const reason = window.prompt('Reason for rejection (shown in audit log):', 'Does not meet editorial standards');
    if (reason === null) return;
    setActionLoadingId(id);
    try {
      await api.post(`/admin/articles/${id}/reject`, { reason });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } finally { setActionLoadingId(null); }
  }

  async function handleRephrase(id) {
    setActionLoadingId(id);
    try {
      await api.post(`/admin/articles/${id}/rephrase`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } finally { setActionLoadingId(null); }
  }

  async function triggerCrawl() {
    setCrawlMessage('Starting crawl...');
    try {
      const { data } = await api.post('/admin/crawl/run');
      setCrawlMessage(data.message);
      setTimeout(() => { loadStats(); loadArticles(); }, 5000);
    } catch (err) {
      setCrawlMessage('Failed to start crawl.');
    }
  }

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand-name">Crawl<span>News</span> Admin</div>
        <div className="nav-item active">📋 Review Queue</div>
        <div className="nav-section-label">Account</div>
        <div style={{ padding: '11px 14px', fontSize: 13, color: '#cbd5e1' }}>{admin?.name} ({admin?.role})</div>
        <button className="nav-item" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }} onClick={logout}>
          ↩ Log out
        </button>
      </div>

      <div className="main-content" style={{ maxWidth: 1100 }}>
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {crawlMessage && <span style={{ fontSize: 12.5, color: '#64748b' }}>{crawlMessage}</span>}
            <button className="btn-approve" onClick={triggerCrawl}>▶ Run Crawl Now</button>
          </div>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card pending">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value">{stats.stats.pending_review}</div>
            </div>
            <div className="stat-card approved">
              <div className="stat-label">Approved</div>
              <div className="stat-value">{stats.stats.approved}</div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{stats.stats.rejected}</div>
            </div>
            <div className="stat-card rephrase">
              <div className="stat-label">Needs Rephrase</div>
              <div className="stat-value">{stats.stats.needs_rephrase}</div>
            </div>
          </div>
        )}

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading-state">Loading articles…</div>}
        {!loading && articles.length === 0 && <div className="empty-state">No articles in this queue.</div>}

        {!loading && articles.map((a) => (
          <div className="article-row" key={a.id}>
            <img
              src={a.generated_image_url || 'https://placehold.co/160x120/eef2ff/2563eb?text=CrawlNews'}
              alt=""
              onError={(e) => { e.target.src = 'https://placehold.co/160x120/eef2ff/2563eb?text=CrawlNews'; }}
            />
            <div style={{ flex: 1 }}>
              <div className="meta">
                <span>{a.source_name}</span>
                <span>•</span>
                <span>{a.main_category_name} / {a.category_name}</span>
                <span className={`badge ${credibilityBadgeClass(a.credibility_score)}`}>
                  Credibility {a.credibility_score != null ? Math.round(a.credibility_score * 100) + '%' : 'N/A'}
                </span>
                <span className="badge credibility-med">{a.fact_check_status}</span>
                {a.rephrase_count > 0 && <span className="badge credibility-med">Rephrased x{a.rephrase_count}</span>}
              </div>
              <h3>{a.title}</h3>
              <p>{a.summary_short}</p>
              {a.ai_decision_reason && (
                <p style={{ marginTop: 6, fontStyle: 'italic', color: '#94a3b8' }}>AI reasoning: {a.ai_decision_reason}</p>
              )}
            </div>
            {activeTab === 'pending_review' && (
              <div className="row-actions">
                <button className="btn-approve" disabled={actionLoadingId === a.id} onClick={() => handleApprove(a.id)}>Approve</button>
                <button className="btn-rephrase" disabled={actionLoadingId === a.id} onClick={() => handleRephrase(a.id)}>Rephrase</button>
                <button className="btn-reject" disabled={actionLoadingId === a.id} onClick={() => handleReject(a.id)}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
