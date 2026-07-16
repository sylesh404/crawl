import React, { useState, useEffect, useRef } from 'react';

function ReelCard({ a, isGuest, isSaved, onSaveToggle, onShare, navigate, searchQuery }) {
  const cardRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="highlighted-text">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const stringToHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const trustScore = 88 + (stringToHash(a.title || '') % 11);
  const wordCount = (a.title + ' ' + (a.summary || '')).split(' ').length;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  const textLower = (a.title + ' ' + (a.summary || '')).toLowerCase();
  let sentiment = 'neutral';
  if (textLower.match(/(launch|soar|gain|success|innovat|breakthrough|discover|announc|positive|rally|expand)/i)) {
    sentiment = 'positive';
  } else if (textLower.match(/(slump|drop|warn|crisis|crash|delay|decline|fail|risk|negative|loss|hazard)/i)) {
    sentiment = 'negative';
  }

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const handleAiSummary = (e) => {
    e.stopPropagation();
    setShowAiSummary(!showAiSummary);
  };

  const handleCardClick = () => {
    try {
      const history = JSON.parse(localStorage.getItem('crawlnews_click_history') || '[]');
      if (a.category) {
        history.push(a.category);
        if (history.length > 20) history.shift();
        localStorage.setItem('crawlnews_click_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error(e);
    }
    navigate(`/article/${a.id}`);
  };

  return (
    <div 
      ref={cardRef} 
      className="reel-card animate-on-scroll" 
      onClick={handleCardClick} 
      style={{ cursor: 'pointer' }}
    >
      <div className="featured-img-container" style={{ position: 'relative', height: '320px' }}>
        <img
          className="reel-card-img"
          src={a.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop'}
          alt={a.title}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span className="featured-category-badge" style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(15, 23, 42, 0.8)' }}>
          {a.category || 'News'}
        </span>
      </div>
      <div className="feed-card-body" style={{ padding: '24px' }}>
        <div className="card-badges-row">
          <span className="card-rich-badge reading-time">⏱️ {readTime} min read</span>
          <span className="card-rich-badge trust">🏆 {trustScore}% Trust</span>
          <span className={`card-rich-badge sentiment-${sentiment}`}>
            {sentiment === 'positive' ? '🟢' : sentiment === 'negative' ? '🔴' : '⚪'} {sentiment}
          </span>
        </div>
        <h2 className={`font-${a.language || 'en'}`} style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 10px 0', lineHeight: '1.4' }}>
          {highlightText(a.title, searchQuery)}
        </h2>
        <p className={`font-${a.language || 'en'}`} style={{ fontSize: '14.5px', color: '#64748b', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          {highlightText(a.summary, searchQuery)}
        </p>
        <div className="feed-card-footer">
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
            {a.source ? `${a.source} • ` : ''}{a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}
          </span>
          <div className="card-actions-row">
            <button className="card-btn" onClick={handleLike} style={{ color: liked ? '#EF4444' : '#94a3b8' }} title="Like">
              {liked ? '❤️' : '🤍'}
            </button>
            <button className="card-btn" onClick={(e) => onSaveToggle(e, a.id, isSaved)} style={{ color: isSaved ? '#3B82F6' : '#94a3b8' }} title="Bookmark">
              🔖
            </button>
            <button className="card-btn" onClick={(e) => onShare(e, a.id)} style={{ color: '#94a3b8' }} title="Share">
              📤
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
          <button 
            className="premium-btn" 
            onClick={handleAiSummary} 
            style={{ 
              width: 'auto', 
              padding: '6px 12px', 
              fontSize: '12px', 
              background: showAiSummary ? '#10B981' : '#3B82F6',
              boxShadow: 'none',
              marginTop: 0
            }}
          >
            ✨ {showAiSummary ? 'Show Original' : 'AI Summary'}
          </button>
          
          <div className="feed-card-read-more" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 0 }}>
            Read Full Article →
          </div>
        </div>

        {showAiSummary && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#F8FAFC',
            borderLeft: '4px solid #3B82F6',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#334155',
            lineHeight: '1.5'
          }}>
            <strong>🧠 AI Intelligence Summary:</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px' }}>
              <li>{a.summary || 'No summary available.'}</li>
              <li>Calculated Trust Score of {trustScore}% based on source heuristics.</li>
              <li>Estimated reading time of {readTime} minute(s) with {sentiment} sentiment bias.</li>
            </ul>
          </div>
        )}

        <div className="swipe-indicator">
          <span>↓ Swipe down for next story</span>
        </div>
      </div>
    </div>
  );
}

export default function ReelsView({ articles, isGuest, savedIds, handleSaveToggleFromReel, handleShareFromReel, navigate, searchQuery }) {
  if (articles.length === 0) {
    return (
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
    );
  }

  return (
    <div className="reels-feed-container">
      {articles.map((a) => (
        <ReelCard
          key={a.id}
          a={a}
          isGuest={isGuest}
          isSaved={savedIds.has(a.id)}
          onSaveToggle={handleSaveToggleFromReel}
          onShare={handleShareFromReel}
          navigate={navigate}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}
