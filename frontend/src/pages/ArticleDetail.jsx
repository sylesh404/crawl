import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import api from '../api/axios.js';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/articles/${id}`)
      // Our backend returns the article object directly
      .then(({ data }) => setArticle(data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load article'));
  }, [id]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ maxWidth: 760 }}>
        <Link to="/home" className="link-blue">← Back to feed</Link>
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
        {article && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>
              {article.category}
            </div>
            <h1 className={`font-${article.language || 'en'}`} style={{ fontSize: 28, marginBottom: 12 }}>{article.title}</h1>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              {article.author ? `By ${article.author} · ` : ''}
              {article.published_at ? new Date(article.published_at).toLocaleString() : ''}
            </div>
            {article.image_url && (
              <img src={article.image_url} alt={article.title} style={{ width: '100%', borderRadius: 14, marginBottom: 20 }} />
            )}
            <p className={`font-${article.language || 'en'}`} style={{ fontSize: 15.5, lineHeight: 1.8, color: '#334155' }}>
              {article.full_content || article.summary}
            </p>

          </div>
        )}
      </div>
    </div>
  );
}
