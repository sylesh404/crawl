import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import api from '../api/axios.js';

export default function SavedArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/articles/saved/list')
      .then(({ data }) => setArticles(data.articles))
      .finally(() => setLoading(false));
  }, []);

  function handleSaveToggle(articleId, nowSaved) {
    if (!nowSaved) setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="page-header"><h1>Saved Articles</h1></div>
        {loading && <div className="loading-state">Loading…</div>}
        {!loading && articles.length === 0 && <div className="empty-state">You haven't saved any articles yet.</div>}
        {!loading && articles.length > 0 && (
          <div className="feed-grid">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} isGuest={false} isSaved={true} onSaveToggle={handleSaveToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
