import React from 'react';
import ArticleCard from './ArticleCard.jsx';

const CATEGORIES = [
  'All', 'Technology', 'AI', 'Business', 'Politics', 'Sports', 'Science', 
  'Health', 'Entertainment', 'Finance', 'Startups', 'Education', 'Environment', 
  'Cybersecurity', 'Space', 'Automobile', 'Travel', 'Lifestyle', 'Movies', 
  'Gaming', 'World'
];

export default function GridView({ 
  firstRow, 
  remaining, 
  selectedCategory, 
  setSelectedCategory, 
  isGuest, 
  savedIds, 
  handleSaveToggle,
  searchQuery
}) {
  const hasResults = firstRow.length > 0 || remaining.length > 0;

  return (
    <div>
      {/* Sticky Category Chips Filter Section */}
      <div className="category-filter-bar" style={{ marginBottom: '24px' }}>
        <div className="category-chips-container">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {!hasResults ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(15, 23, 42, 0.05)',
          color: '#64748b',
          fontSize: '15px',
          marginTop: '20px'
        }}>
          🔍 No results found matching your search. Try adjusting your query or category filters.
        </div>
      ) : (
        <>
          {/* First row of recommended news */}
          {firstRow.length > 0 && (
            <div className="feed-grid" style={{ marginBottom: '24px' }}>
              {firstRow.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  isGuest={isGuest}
                  isSaved={savedIds.has(a.id)}
                  onSaveToggle={handleSaveToggle}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}

          {/* Remaining Recommended Feed */}
          {remaining.length > 0 && (
            <div className="feed-grid">
              {remaining.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  isGuest={isGuest}
                  isSaved={savedIds.has(a.id)}
                  onSaveToggle={handleSaveToggle}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
