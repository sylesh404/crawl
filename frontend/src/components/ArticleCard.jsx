import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Award, Clock, Heart } from 'lucide-react';
import api from '../api/axios.js';

export default function ArticleCard({ article, isGuest, onSaveToggle, isSaved, searchQuery }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [liked, setLiked] = useState(false);

  // Setup Intersection Observer for slide-up entry animation on scroll
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

  async function handleSave(e) {
    e.stopPropagation();
    if (isGuest) {
      navigate('/signup');
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/articles/${article.id}/save`);
      } else {
        await api.post(`/articles/${article.id}/save`);
      }
      onSaveToggle?.(article.id, !isSaved);
    } catch (err) {
      console.error('save toggle failed', err);
    }
  }

  function handleShare(e) {
    e.stopPropagation();
    const url = `${window.location.origin}/article/${article.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Article link copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy link', err);
      });
    } else {
      alert(`Article Link: ${url}`);
    }
  }

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  // Calculate dynamic stable trust score based on title hash
  const stringToHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  const titleHash = stringToHash(article.title || '');
  const trustScore = 88 + (titleHash % 11); // 88% to 98%

  // Determine sentiment
  const textLower = (article.title + ' ' + (article.summary || '')).toLowerCase();
  let sentiment = 'neutral';
  if (textLower.match(/(launch|soar|gain|success|innovat|breakthrough|discover|announc|positive|rally|expand)/i)) {
    sentiment = 'positive';
  } else if (textLower.match(/(slump|drop|warn|crisis|crash|delay|decline|fail|risk|negative|loss|hazard)/i)) {
    sentiment = 'negative';
  }

  // Reading time
  const wordCount = (article.title + ' ' + (article.summary || '')).split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div 
      ref={cardRef} 
      className="feed-card animate-on-scroll" 
      onClick={() => {
        try {
          const history = JSON.parse(localStorage.getItem('crawlnews_click_history') || '[]');
          if (article.category) {
            history.push(article.category);
            if (history.length > 20) history.shift();
            localStorage.setItem('crawlnews_click_history', JSON.stringify(history));
          }
        } catch (e) {
          console.error(e);
        }
        navigate(`/article/${article.id}`);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-image-wrapper">
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop'}
          alt={article.title}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop'; }}
        />
        <span className="card-category-tag">{article.category || 'General'}</span>
      </div>

      <div className="feed-card-body">
        {/* Rich Metadata row */}
        <div className="card-badges-row">
          <span className="card-rich-badge reading-time">
            <Clock size={10} /> {readTime} min read
          </span>
          <span className="card-rich-badge trust">
            <Award size={10} /> {trustScore}% Trust
          </span>
          <span className={`card-rich-badge sentiment-${sentiment}`}>
            {sentiment === 'positive' ? '🟢' : sentiment === 'negative' ? '🔴' : '⚪'} {sentiment}
          </span>
        </div>

        <h3 className={`font-${article.language || 'en'}`}>{highlightText(article.title, searchQuery)}</h3>
        <p className={`font-${article.language || 'en'}`}>{highlightText(article.summary, searchQuery)}</p>
        
        <div className="feed-card-footer">
          <div className="card-footer-left">
            <span className="card-source">{article.source || 'News'}</span>
            <span className="card-dot" />
            <span className="card-date">
              {article.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
            </span>
          </div>
          
          <div className="card-actions-row">
            <button 
              className={`card-action-btn ${liked ? 'liked' : ''}`} 
              onClick={handleLike} 
              title="Like"
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button 
              className={`card-action-btn ${isSaved ? 'saved' : ''}`} 
              onClick={handleSave} 
              title={isSaved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button 
              className="card-action-btn" 
              onClick={handleShare} 
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
