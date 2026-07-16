import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronDown, Bookmark, Share2, Award, Clock, ArrowRight, Sun, Moon, CloudRain, ShieldCheck, Thermometer, Wind, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import api from '../api/axios.js';

const GridView = React.lazy(() => import('../components/GridView.jsx'));
const ReelsView = React.lazy(() => import('../components/ReelsView.jsx'));
import ArticleCard from '../components/ArticleCard.jsx';


const getInitialViewMode = () => {
  const saved = localStorage.getItem('crawlnews_view_preference');
  if (saved) return saved;
  if (window.innerWidth <= 768) {
    return 'reels';
  }
  return 'grid';
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', native: 'English', label: 'English' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi' },
  { code: 'ta', native: 'தமிழ்', label: 'Tamil' },
  { code: 'te', native: 'తెలుగు', label: 'Telugu' },
  { code: 'kn', native: 'ಕನ್ನಡ', label: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', label: 'Malayalam' },
  { code: 'bn', native: 'বাংলা', label: 'Bengali' },
  { code: 'gu', native: 'ગુજરાતી', label: 'Gujarati' },
  { code: 'mr', native: 'मराठी', label: 'Marathi' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', label: 'Punjabi' },
];

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeMain, setActiveMain] = useState(null);   // null = "For You" / trending
  const [activeSub, setActiveSub] = useState(null);
  const [articles, setArticles] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savedArticles, setSavedArticles] = useState([]);
  const [errorState, setErrorState] = useState('');

  // UI state
  const [isLanguagesModalOpen, setIsLanguagesModalOpen] = useState(false);
  const [tempLanguages, setTempLanguages] = useState([]);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleRemainingCount, setVisibleRemainingCount] = useState(6);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);

  const [greeting, setGreeting] = useState('Welcome');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHoveredHero, setIsHoveredHero] = useState(false);

  // Weather presets
  const weatherCities = [
    { name: 'New York, US', temp: '74°F', condition: 'Sunny', humidity: '42%', wind: '6 mph', aqi: '32 (Good)', icon: '☀️', bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { name: 'London, UK', temp: '62°F', condition: 'Drizzle', humidity: '80%', wind: '14 mph', aqi: '18 (Excellent)', icon: '🌦️', bg: 'linear-gradient(135deg, #475569, #64748b)' },
    { name: 'Paris, FR', temp: '68°F', condition: 'Cloudy', humidity: '55%', wind: '9 mph', aqi: '28 (Good)', icon: '☁️', bg: 'linear-gradient(135deg, #1e293b, #334155)' },
    { name: 'Tokyo, JP', temp: '78°F', condition: 'Humid', humidity: '72%', wind: '5 mph', aqi: '45 (Good)', icon: '🌧️', bg: 'linear-gradient(135deg, #0f172a, #1e293b)' }
  ];
  const [weatherIndex, setWeatherIndex] = useState(0);
  const weather = weatherCities[weatherIndex];

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crawlnews_recent_searches') || '[]');
    } catch (e) {
      return [];
    }
  });

  const trendingKeywords = ['GPT-5', 'Semiconductors', 'Carbon Neutrality', 'Exoplanet', 'Trade Deal'];

  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      icon: '🔴',
      title: 'Breaking News',
      description: 'OpenAI launches GPT-5.5 with reasoning core.',
      time: '5m ago',
      read: false
    },
    {
      id: 'n2',
      icon: '📰',
      title: 'New article published',
      description: 'Global Tech Index rallies on semiconductor demand.',
      time: '15m ago',
      read: false
    },
    {
      id: 'n3',
      icon: '🤖',
      title: 'AI Summary ready',
      description: 'Interactive AI summary has been computed for you.',
      time: '1h ago',
      read: true
    },
    {
      id: 'n4',
      icon: '⭐',
      title: 'Saved article updated',
      description: 'Your saved article has new comments from the author.',
      time: '2h ago',
      read: false
    },
    {
      id: 'n5',
      icon: '📌',
      title: 'Trending topic',
      description: 'Semiconductors are trending in Technology.',
      time: '4h ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchSuggestionsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchSuggestionsOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setVisibleRemainingCount(6);
  }, [selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        setVisibleRemainingCount(prev => prev + 6);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setDebouncedSearchQuery(searchQuery);
      saveSearchQuery(searchQuery);
      setIsSearchSuggestionsOpen(false);
    }
  };

  const saveSearchQuery = (query) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== query);
      const next = [query, ...filtered].slice(0, 5);
      localStorage.setItem('crawlnews_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const logout = () => {
    localStorage.removeItem('crawlnews_user_token');
    localStorage.removeItem('crawlnews_user');
    navigate('/login');
  };

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

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('crawlnews_view_preference', mode);
  };

  const userJson = localStorage.getItem('crawlnews_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isGuest = !user || user.isGuest;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const savedLangs = localStorage.getItem('website_languages');
    if (savedLangs) setLanguages(JSON.parse(savedLangs));
  }, []);

  const openLanguagesModal = () => {
    setTempLanguages([...languages]);
    setIsLanguagesModalOpen(true);
  };

  const toggleTempLanguage = (code) => {
    setTempLanguages(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const saveLanguages = () => {
    setLanguages(tempLanguages);
    localStorage.setItem('website_languages', JSON.stringify(tempLanguages));
    setIsLanguagesModalOpen(false);
    showToast('Languages updated successfully!');
  };

  const fetchArticles = () => {
    setLoading(true);
    setErrorState('');
    let url = activeMain ? `/articles?category=${activeMain}&limit=50` : '/articles?limit=50';
    if (languages.length > 0) {
      url += `&language=${languages.join(',')}`;
    }
    api.get(url)
      .then(({ data }) => setArticles(data.data || []))
      .catch((err) => {
        console.error('Failed to fetch articles', err);
        setErrorState(err.response?.data?.error || 'Unable to sync feeds. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const mappedCategories = data.map(c => ({
        id: c.category,
        name: c.category,
        slug: c.category,
        subcategories: []
      }));
      setCategories(mappedCategories);
    }).catch(() => {});
    
    if (!isGuest) {
      api.get('/articles/saved/list').then(({ data }) => {
        setSavedArticles(data.articles || []);
        setSavedIds(new Set(data.articles.map((a) => a.id)));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [activeMain, activeSub, languages]);

  function handleSaveToggle(articleId, nowSaved) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      nowSaved ? next.add(articleId) : next.delete(articleId);
      return next;
    });

    if (nowSaved) {
      const articleObj = articles.find(a => a.id === articleId);
      if (articleObj) {
        setSavedArticles(prev => {
          if (prev.some(a => a.id === articleId)) return prev;
          return [articleObj, ...prev];
        });
      }
    } else {
      setSavedArticles(prev => prev.filter(a => a.id !== articleId));
    }
  }

  // Handle bookmark inside Reels view
  async function handleSaveToggleFromReel(e, articleId, isSaved) {
    e.stopPropagation();
    if (isGuest) {
      navigate('/signup');
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/articles/${articleId}/save`);
      } else {
        await api.post(`/articles/${articleId}/save`);
      }
      handleSaveToggle(articleId, !isSaved);
      showToast(isSaved ? 'Article unsaved' : 'Article saved to bookmarks');
    } catch (err) {
      console.error('save toggle failed', err);
    }
  }

  function handleShareFromReel(e, articleId) {
    e.stopPropagation();
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {});
    }
  }

  // Helper to extract or mock featured section articles
  const getFeaturedArticle = (categoryName, indexFallback) => {
    const match = articles.find(a => 
      a.category?.toLowerCase() === categoryName.toLowerCase() || 
      a.title?.toLowerCase().includes(categoryName.toLowerCase()) ||
      (a.summary && a.summary.toLowerCase().includes(categoryName.toLowerCase()))
    );
    if (match) return match;
    
    // Fallback high-quality news card objects
    const fallbacks = {
      International: {
        id: 'feat-international',
        title: 'Global Alliance Sets New Milestones in Carbon Neutrality',
        summary: 'World leaders assemble in Paris to finalize binding agreements reducing industrial emission levels by 40% over the coming decade.',
        category: 'World',
        image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
        published_at: new Date().toISOString(),
        source: 'Global Bureau'
      },
      National: {
        id: 'feat-national',
        title: 'Semiconductor Megafab Commences Operations at Tech Hub',
        summary: 'India inaugurates its state-of-the-art silicon foundry, projecting self-sufficiency in automotive chips and defense modules.',
        category: 'Technology',
        image_url: 'https://images.unsplash.com/photo-1532375811409-905115e3b5a9?q=80&w=600&auto=format&fit=crop',
        published_at: new Date().toISOString(),
        source: 'Capital Chronicle'
      },
      Local: {
        id: 'feat-local',
        title: 'Greenway Transit Commision Extends Electric Metro Corridors',
        summary: 'Metropolitan authorities confirm three new transit branches, serving an estimated half-million daily commuters starting next quarter.',
        category: 'Infrastructure',
        image_url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=600&auto=format&fit=crop',
        published_at: new Date().toISOString(),
        source: 'Municipal Gazette'
      }
    };
    return fallbacks[categoryName] || fallbacks.International;
  };

  const featuredInt = getFeaturedArticle('International', 0);
  const featuredNat = getFeaturedArticle('National', 1);
  const featuredLoc = getFeaturedArticle('Local', 2);

  const activeCategoryObj = categories.find((c) => c.slug === activeMain);

  // Set of featured article IDs to exclude
  const featuredIds = new Set([featuredInt?.id, featuredNat?.id, featuredLoc?.id].filter(Boolean));

  // Exclude featured categories from Latest Stories recommended feed
  const excludedCategories = new Set(['international', 'national', 'local']);

  // Filter recommended articles
  const filteredArticles = articles.filter(a => {
    if (featuredIds.has(a.id)) return false;
    const cat = a.category?.toLowerCase() || '';
    if (excludedCategories.has(cat)) return false;
    return true;
  });

  // Smart personalization click history
  let clickHistory = [];
  try {
    clickHistory = JSON.parse(localStorage.getItem('crawlnews_click_history') || '[]');
  } catch (e) {
    console.error(e);
  }

  const historyFreq = {};
  clickHistory.forEach(cat => {
    const lowerCat = cat.toLowerCase();
    historyFreq[lowerCat] = (historyFreq[lowerCat] || 0) + 1;
  });

  // Group by category
  const groups = {};
  filteredArticles.forEach(a => {
    const cat = (a.category || 'General').toLowerCase();
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(a);
  });

  // Sort each category group by freshness (latest first)
  Object.keys(groups).forEach(cat => {
    groups[cat].sort((x, y) => {
      const dateX = x.published_at ? new Date(x.published_at).getTime() : 0;
      const dateY = y.published_at ? new Date(y.published_at).getTime() : 0;
      return dateY - dateX;
    });
  });

  // Sort categories by user interest history count
  const sortedCategories = Object.keys(groups).sort((catA, catB) => {
    const freqA = historyFreq[catA] || 0;
    const freqB = historyFreq[catB] || 0;
    return freqB - freqA;
  });

  // Mix categories using round-robin interleaving
  const recommendedArticles = [];
  let index = 0;
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    sortedCategories.forEach(cat => {
      if (groups[cat][index]) {
        recommendedArticles.push(groups[cat][index]);
        hasMore = true;
      }
    });
    index++;
  }

  // Filter by search query
  const searchedArticles = recommendedArticles.filter(a => {
    if (!debouncedSearchQuery) return true;
    const query = debouncedSearchQuery.toLowerCase();
    const titleMatch = (a.title || '').toLowerCase().includes(query);
    const categoryMatch = (a.category || '').toLowerCase().includes(query);
    const summaryMatch = (a.summary || '').toLowerCase().includes(query);
    const sourceMatch = (a.source || '').toLowerCase().includes(query);
    return titleMatch || categoryMatch || summaryMatch || sourceMatch;
  });

  // Filter by selected category (All or specific category)
  const filteredRecommended = searchedArticles.filter(a => {
    if (selectedCategory === 'All') return true;
    return a.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Slides array for Hero Carousel
  const heroSlides = [featuredInt, featuredNat, featuredLoc].filter(Boolean);

  useEffect(() => {
    if (isHoveredHero || heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHoveredHero, heroSlides.length]);

  const activeHero = heroSlides[activeSlide];

  // Dynamic reading time calculation
  const getReadTime = (a) => {
    const text = (a.title || '') + ' ' + (a.summary || '');
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 180));
  };

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setActiveSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setActiveSlide(prev => (prev + 1) % heroSlides.length);
  };

  const isHeroSaved = activeHero ? savedIds.has(activeHero.id) : false;

  const toggleSaveHero = async (e) => {
    e.stopPropagation();
    if (!activeHero) return;
    if (isGuest) {
      navigate('/signup');
      return;
    }
    try {
      if (isHeroSaved) {
        await api.delete(`/articles/${activeHero.id}/save`);
      } else {
        await api.post(`/articles/${activeHero.id}/save`);
      }
      handleSaveToggle(activeHero.id, !isHeroSaved);
      showToast(isHeroSaved ? 'Article unsaved' : 'Article saved to bookmarks');
    } catch (err) {
      console.error(err);
    }
  };

  const shareHero = (e) => {
    e.stopPropagation();
    if (!activeHero) return;
    const url = `${window.location.origin}/article/${activeHero.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {});
    }
  };

  const handleViewAllCategory = (catSlug) => {

    setActiveMain(catSlug);
    setSelectedCategory('All');
    setActiveSub(null);
  };

  const getSectionArticles = (categoryName) => {
    return articles.filter(a => {
      if (a.category?.toLowerCase() !== categoryName.toLowerCase()) return false;
      if (featuredIds.has(a.id)) return false;
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const titleMatch = (a.title || '').toLowerCase().includes(query);
        const categoryMatch = (a.category || '').toLowerCase().includes(query);
        const summaryMatch = (a.summary || '').toLowerCase().includes(query);
        const sourceMatch = (a.source || '').toLowerCase().includes(query);
        return titleMatch || categoryMatch || summaryMatch || sourceMatch;
      }
      return true;
    }).slice(0, 3);
  };

  const renderCategoryColumn = (title, icon, slug, sectionArticles, delay = 0) => {
    return (
      <motion.div 
        className="dashboard-column"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: 'easeOut', delay }}
      >
        <div className="dashboard-column-title-row">
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ marginLeft: '8px' }}>{title}</span>
        </div>

        <div className="dashboard-column-cards">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div className="skeleton-img" style={{ height: '120px', background: 'var(--slate-100)', borderRadius: '12px', marginBottom: '12px' }} />
                <div className="skeleton-title" style={{ height: '16px', background: 'var(--slate-100)', borderRadius: '4px', width: '80%', marginBottom: '8px' }} />
                <div className="skeleton-text" style={{ height: '12px', background: 'var(--slate-100)', borderRadius: '4px', width: '100%', marginBottom: '6px' }} />
                <div className="skeleton-text" style={{ height: '12px', background: 'var(--slate-100)', borderRadius: '4px', width: '90%', marginBottom: '12px' }} />
              </div>
            ))
          ) : sectionArticles.length === 0 ? (
            <div className="saved-widget-empty" style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No articles available in this category.
            </div>
          ) : (
            sectionArticles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                isGuest={isGuest}
                isSaved={savedIds.has(a.id)}
                onSaveToggle={handleSaveToggle}
                searchQuery={debouncedSearchQuery}
              />
            ))
          )}
        </div>

        <div className="dashboard-column-footer">
          <button 
            className="widget-view-all-btn" 
            onClick={() => handleViewAllCategory(slug)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '750' }}
          >
            View All <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderCategorySection = (title, icon, slug, sectionArticles) => {

    return (
      <motion.div 
        className="category-section-block"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ marginBottom: '40px' }}
      >
        <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-category-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            <span>{icon}</span> {title}
          </h3>
          <button 
            className="widget-view-all-btn" 
            onClick={() => handleViewAllCategory(slug)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '750' }}
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="feed-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div className="skeleton-img" style={{ height: '160px', background: 'var(--slate-100)', borderRadius: '12px', marginBottom: '12px' }} />
                <div className="skeleton-title" style={{ height: '20px', background: 'var(--slate-100)', borderRadius: '4px', width: '80%', marginBottom: '8px' }} />
                <div className="skeleton-text" style={{ height: '14px', background: 'var(--slate-100)', borderRadius: '4px', width: '100%', marginBottom: '6px' }} />
                <div className="skeleton-text" style={{ height: '14px', background: 'var(--slate-100)', borderRadius: '4px', width: '90%', marginBottom: '12px' }} />
                <div className="skeleton-meta" style={{ height: '12px', background: 'var(--slate-100)', borderRadius: '4px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : sectionArticles.length === 0 ? (
          <div className="saved-widget-empty" style={{ padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No articles available in this category.
          </div>
        ) : (
          <div className="feed-grid horizontal-swipe-row">
            {sectionArticles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                isGuest={isGuest}
                isSaved={savedIds.has(a.id)}
                onSaveToggle={handleSaveToggle}
                searchQuery={debouncedSearchQuery}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (

    <div className="app-shell">
      {/* Toast popup */}
      {toast && (
        <div className="toast-notification">
          <span>✓</span> {toast}
        </div>
      )}

      {/* Sidebar with language modal event triggers */}
      <Sidebar onLanguagesClick={openLanguagesModal} />

      <div className="main-content">
        {/* Left Column: Feed Content */}
        <div className="feed-container">
          
          {/* Header Row */}
          <div className="header-actions-row">
            <div>
              <span className="greeting-pill">{greeting}</span>
              <h1 className="main-feed-title">{activeMain ? activeCategoryObj?.name : 'Current News'}</h1>
              <p className="main-feed-subtitle">Stay updated with the latest stories from around the world.</p>
            </div>

            <div className="header-controls">
              {/* Search Container */}
              <div className="search-bar-container" ref={searchContainerRef}>
                <Search className="search-icon" size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search articles, topics or keywords... (Press '/')"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsSearchSuggestionsOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={handleClearSearch}>✕</button>
                )}

                {/* Suggestions Overlay Dropdown */}
                {isSearchSuggestionsOpen && (
                  <div className="search-suggestions-dropdown">
                    {searchQuery.trim() ? (
                      <div className="suggestions-section">
                        <h5>Suggested Matches</h5>
                        {searchSuggestions.length > 0 ? (
                          searchSuggestions.map(a => (
                            <div 
                              key={a.id} 
                              className="suggestion-item" 
                              onClick={() => {
                                setIsSearchSuggestionsOpen(false);
                                navigate(`/article/${a.id}`);
                              }}
                            >
                              <span className="suggest-badge">{a.category || 'News'}</span>
                              <span className="suggest-title">{a.title}</span>
                            </div>
                          ))
                        ) : (
                          <div className="suggestions-empty">No instant matches found. Press Enter to search.</div>
                        )}
                      </div>
                    ) : (
                      <>
                        {recentSearches.length > 0 && (
                          <div className="suggestions-section">
                            <h5>Recent Searches</h5>
                            {recentSearches.map((q, i) => (
                              <div 
                                key={i} 
                                className="suggestion-item recent"
                                onClick={() => {
                                  setSearchQuery(q);
                                  setDebouncedSearchQuery(q);
                                  setIsSearchSuggestionsOpen(false);
                                }}
                              >
                                <span>🔍 {q}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="suggestions-section">
                          <h5>Trending Keywords</h5>
                          <div className="trending-tags-row">
                            {trendingKeywords.map((kw, i) => (
                              <button 
                                key={i} 
                                className="trending-tag-btn"
                                onClick={() => {
                                  setSearchQuery(kw);
                                  setDebouncedSearchQuery(kw);
                                  setIsSearchSuggestionsOpen(false);
                                }}
                              >
                                {kw}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="bell-container" ref={bellRef}>
                <button className="bell-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
                </button>
                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      <button onClick={markAllAsRead}>Mark all as read</button>
                    </div>
                    <div className="notification-list">
                      {notifications.map(n => (
                        <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => toggleRead(n.id)}>
                          <span className="notif-icon">{n.icon}</span>
                          <div className="notif-info">
                            <div className="notif-title-row">
                              <span className="notif-title">{n.title}</span>
                              {!n.read && <span className="unread-dot" />}
                            </div>
                            <p className="notif-desc">{n.description}</p>
                            <span className="notif-time">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="notification-footer">
                      <button onClick={markAllAsRead}>Mark all as read</button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar */}
              <div className="profile-container" ref={profileRef}>
                <button className="profile-avatar-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  <div className="avatar-img-circle">
                    <span>{(user?.name || user?.email || 'G')[0].toUpperCase()}</span>
                  </div>
                  <ChevronDown size={14} className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`} />
                </button>
                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-user-info">
                      <p className="user-name">{user?.name || (isGuest ? 'Guest User' : user?.email)}</p>
                      <p className="user-email">{isGuest ? 'Sign up for personal feed' : user?.email}</p>
                    </div>
                    <div className="divider" />
                    <button className="dropdown-item" onClick={() => showToast('Profile settings are only editable for premium accounts')}>👤 Profile</button>
                    <button className="dropdown-item" onClick={() => { setIsProfileOpen(false); navigate(isGuest ? '/signup' : '/saved'); }}>Saved Articles</button>
                    <button className="dropdown-item" onClick={() => { setIsProfileOpen(false); openLanguagesModal(); }}>Languages</button>
                    <button className="dropdown-item" onClick={() => showToast('Settings is currently locked for premium users')}>⚙ Settings</button>
                    <div className="divider" />
                    <button className="dropdown-item logout" onClick={() => { setIsProfileOpen(false); logout(); }}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Switcher Row */}
          <div className="switcher-row">
            <div className="view-switcher-container">
              <div 
                className="switch-slider" 
                style={{ transform: viewMode === 'grid' ? 'translateX(0)' : 'translateX(100%)' }}
              />
              <button 
                className={`switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleViewChange('grid')}
              >
                Grid View
              </button>
              <button 
                className={`switch-btn ${viewMode === 'reels' ? 'active' : ''}`}
                onClick={() => handleViewChange('reels')}
              >
                Reels View
              </button>
            </div>
          </div>

          {/* Categories navigation */}
          <div className="category-tabs">
            <button className={`category-pill ${!activeMain ? 'active' : ''}`} onClick={() => { setActiveMain(null); setActiveSub(null); }}>
              {isGuest ? 'Current News' : 'For You'}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`category-pill ${activeMain === c.slug ? 'active' : ''}`}
                onClick={() => { setActiveMain(c.slug); setActiveSub(null); }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Breaking News Marquee Strip */}
          <div className="breaking-news-strip">
            <div className="breaking-label">⚡ BREAKING NEWS</div>
            <div className="marquee-container">
              <div className="marquee-content">
                <span className="marquee-item">OpenAI launches GPT-5.5 with reasoning core</span>
                <span className="marquee-item">Global Tech Index rallies on semiconductor demand</span>
                <span className="marquee-item">NASA spacecraft detects atmospheric signals on exoplanet</span>
                <span className="marquee-item">India signs strategic digital infrastructure alliance</span>
                <span className="marquee-item">Microsoft announces carbon-negative datacenters expansion</span>
                {/* Duplicate for seamless scrolling marquee */}
                <span className="marquee-item">OpenAI launches GPT-5.5 with reasoning core</span>
                <span className="marquee-item">Global Tech Index rallies on semiconductor demand</span>
                <span className="marquee-item">NASA spacecraft detects atmospheric signals on exoplanet</span>
                <span className="marquee-item">India signs strategic digital infrastructure alliance</span>
                <span className="marquee-item">Microsoft announces carbon-negative datacenters expansion</span>
              </div>
            </div>
          </div>

          {/* Hero Featured News Section */}
          {activeHero && (
            <div 
              className="premium-hero-card"
              onMouseEnter={() => setIsHoveredHero(true)}
              onMouseLeave={() => setIsHoveredHero(false)}
              onClick={() => activeHero.id.startsWith('feat-') ? null : navigate(`/article/${activeHero.id}`)}
              style={{ cursor: activeHero.id.startsWith('feat-') ? 'default' : 'pointer' }}
            >
              <div className="hero-content-side">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="hero-category-badge">
                    {activeHero.category?.toLowerCase() === 'world' ? '🌍' : activeHero.category?.toLowerCase() === 'technology' ? '💻' : '📍'} {activeHero.category}
                  </span>
                  <span className="hero-meta-badge"><Clock size={11} /> {getReadTime(activeHero)} min read</span>
                </div>

                <h2 className="hero-title">{highlightText(activeHero.title, debouncedSearchQuery)}</h2>
                <p className="hero-summary">{highlightText(activeHero.summary, debouncedSearchQuery)}</p>

                <div className="hero-actions-row">
                  {!activeHero.id.startsWith('feat-') && (
                    <button className="hero-read-btn" onClick={() => navigate(`/article/${activeHero.id}`)}>
                      Read Full Article <ArrowRight size={14} />
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`hero-action-circle-btn ${isHeroSaved ? 'active' : ''}`}
                      onClick={toggleSaveHero}
                      title={isHeroSaved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark size={15} fill={isHeroSaved ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="hero-action-circle-btn"
                      onClick={shareHero}
                      title="Share"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="hero-meta-footer">
                  <span>Source: <strong>{activeHero.source}</strong></span>
                  <span>Published: {activeHero.published_at ? new Date(activeHero.published_at).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>

              <div className="hero-image-side">
                <img src={activeHero.image_url} alt={activeHero.title} />
                
                {/* Carousel Controls */}
                <div className="hero-carousel-nav">
                  <button className="carousel-nav-btn" onClick={handlePrevSlide} aria-label="Previous Slide">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="carousel-nav-btn" onClick={handleNextSlide} aria-label="Next Slide">
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Pagination Dots */}
                <div className="hero-pagination">
                  {heroSlides.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`pagination-dot ${idx === activeSlide ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(idx);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Articles Feed */}
          {activeMain !== null ? (
            // Single Category View
            <>
              <div className="section-header-row">
                <h2>{categories.find(c => c.slug === activeMain)?.name || activeMain} Stories</h2>
              </div>

              {loading && (
                <div className="feed-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="skeleton-card" style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div className="skeleton-img" style={{ height: '160px', background: 'var(--slate-100)', borderRadius: '12px', marginBottom: '12px' }} />
                      <div className="skeleton-title" style={{ height: '20px', background: 'var(--slate-100)', borderRadius: '4px', width: '80%', marginBottom: '8px' }} />
                      <div className="skeleton-text" style={{ height: '14px', background: 'var(--slate-100)', borderRadius: '4px', width: '100%', marginBottom: '6px' }} />
                      <div className="skeleton-text" style={{ height: '14px', background: 'var(--slate-100)', borderRadius: '4px', width: '90%', marginBottom: '12px' }} />
                      <div className="skeleton-meta" style={{ height: '12px', background: 'var(--slate-100)', borderRadius: '4px', width: '40%' }} />
                    </div>
                  ))}
                </div>
              )}

              {!loading && errorState && (
                <div className="empty-state" style={{ padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid #fee2e2' }}>
                  <span style={{ fontSize: '50px' }}>⚠️</span>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '16px', color: '#B91C1C' }}>Feed Synchronization Error</h2>
                  <p style={{ color: '#991B1B', maxWidth: '360px', margin: '8px auto 0 auto', fontSize: '14px', lineHeight: '1.5' }}>
                    {errorState}
                  </p>
                  <button className="modal-btn-continue" style={{ marginTop: '20px', background: '#DC2626' }} onClick={fetchArticles}>
                    Retry Feeds
                  </button>
                </div>
              )}

              {!loading && !errorState && filteredRecommended.length === 0 && (
                <div className="empty-state" style={{ padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '50px' }}>🔍</span>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '16px', color: 'var(--text-primary)' }}>No News Found</h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', margin: '8px auto 0 auto', fontSize: '14px', lineHeight: '1.5' }}>
                    Try adjusting your category selection or choosing different languages to discover recent articles.
                  </p>
                  <button className="modal-btn-continue" style={{ marginTop: '20px' }} onClick={() => { setSelectedCategory('All'); setActiveMain(null); setActiveSub(null); }}>
                    Reset Feed
                  </button>
                </div>
              )}

              {!loading && !errorState && filteredRecommended.length > 0 && (
                <AnimatePresence mode="wait">
                  {viewMode === 'grid' ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading Grid view...</div>}>
                        <GridView
                          firstRow={filteredRecommended.slice(0, 3)}
                          remaining={filteredRecommended.slice(3, 3 + visibleRemainingCount)}
                          selectedCategory={selectedCategory}
                          setSelectedCategory={setSelectedCategory}
                          isGuest={isGuest}
                          savedIds={savedIds}
                          handleSaveToggle={handleSaveToggle}
                          searchQuery={debouncedSearchQuery}
                        />
                      </Suspense>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="reels"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading Reels...</div>}>
                        <ReelsView
                          articles={filteredRecommended}
                          isGuest={isGuest}
                          savedIds={savedIds}
                          handleSaveToggleFromReel={handleSaveToggleFromReel}
                          handleShareFromReel={handleShareFromReel}
                          navigate={navigate}
                          searchQuery={debouncedSearchQuery}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </>
          ) : (
            // Home View (shows 3 horizontal stacked categories in grid view)
            <>
              {viewMode === 'grid' ? (
                <>
                  {/* Dashboard Category Columns */}
                  <div className="dashboard-columns-container">
                    {renderCategoryColumn('International News', '🌍', 'International', getSectionArticles('International'), 0)}
                    {renderCategoryColumn('National News', '🇮🇳', 'National', getSectionArticles('National'), 0.1)}
                    {renderCategoryColumn('Local News', '📍', 'Local', getSectionArticles('Local'), 0.2)}
                  </div>

                  {/* Recommended News Section */}
                  <motion.div 
                    className="recommended-section"
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <div className="recommended-header-row">
                      <h2><span>✨</span> Recommended News</h2>
                    </div>

                    {loading ? (
                      <div className="feed-grid">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="skeleton-card" style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                            <div className="skeleton-img" style={{ height: '160px', background: 'var(--slate-100)', borderRadius: '12px', marginBottom: '12px' }} />
                            <div className="skeleton-title" style={{ height: '20px', background: 'var(--slate-100)', borderRadius: '4px', width: '80%', marginBottom: '8px' }} />
                            <div className="skeleton-text" style={{ height: '14px', background: 'var(--slate-100)', borderRadius: '4px', width: '100%', marginBottom: '6px' }} />
                          </div>
                        ))}
                      </div>
                    ) : filteredRecommended.length === 0 ? (
                      <div className="saved-widget-empty" style={{ padding: '32px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No recommended articles available.
                      </div>
                    ) : (
                      <>
                        <div className="recommended-horizontal-grid">
                          {filteredRecommended.slice(0, visibleRemainingCount).map((a) => (
                            <ArticleCard
                              key={a.id}
                              article={a}
                              isGuest={isGuest}
                              isSaved={savedIds.has(a.id)}
                              onSaveToggle={handleSaveToggle}
                              searchQuery={debouncedSearchQuery}
                            />
                          ))}
                        </div>

                        {visibleRemainingCount < filteredRecommended.length && (
                          <div className="load-more-btn-container">
                            <button 
                              className="load-more-btn"
                              onClick={() => setVisibleRemainingCount(prev => prev + 4)}
                            >
                              Load More Articles
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </>
              ) : (

                // Reels View for Home feed
                <>
                  <div className="section-header-row">
                    <h2>Latest Stories</h2>
                  </div>

                  {loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading Reels...</div>
                  )}

                  {!loading && errorState && (
                    <div className="empty-state" style={{ padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid #fee2e2' }}>
                      <span style={{ fontSize: '50px' }}>⚠️</span>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '16px', color: '#B91C1C' }}>Feed Synchronization Error</h2>
                      <p style={{ color: '#991B1B', maxWidth: '360px', margin: '8px auto 0 auto', fontSize: '14px', lineHeight: '1.5' }}>
                        {errorState}
                      </p>
                      <button className="modal-btn-continue" style={{ marginTop: '20px', background: '#DC2626' }} onClick={fetchArticles}>
                        Retry Feeds
                      </button>
                    </div>
                  )}

                  {!loading && !errorState && filteredRecommended.length === 0 && (
                    <div className="empty-state" style={{ padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '18px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No articles available in your feed.
                    </div>
                  )}

                  {!loading && !errorState && filteredRecommended.length > 0 && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="reels-home"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                      >
                        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading Reels...</div>}>
                          <ReelsView
                            articles={filteredRecommended}
                            isGuest={isGuest}
                            savedIds={savedIds}
                            handleSaveToggleFromReel={handleSaveToggleFromReel}
                            handleShareFromReel={handleShareFromReel}
                            navigate={navigate}
                            searchQuery={debouncedSearchQuery}
                          />
                        </Suspense>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Right Column: Sticky Widgets Sidebar */}
        <div className="right-sidebar">
          
          {/* Weather Card */}
          <div 
            className="weather-widget-card" 
            style={{ background: weather.bg }}
            onClick={() => setWeatherIndex(prev => (prev + 1) % weatherCities.length)}
          >
            <div className="weather-top-row">
              <div>
                <h4 className="weather-city">{weather.name}</h4>
                <p className="weather-condition">{weather.condition}</p>
              </div>
              <div className="weather-emoji-icon">{weather.icon}</div>
            </div>
            
            <div className="weather-temp-row">
              <span className="weather-temp">{weather.temp}</span>
              <div className="weather-meta-items">
                <span className="weather-meta-item"><Thermometer size={12} /> Air Quality: {weather.aqi}</span>
                <span className="weather-meta-item"><Wind size={12} /> Wind: {weather.wind}</span>
              </div>
            </div>
            
            <div className="weather-footer">
              <span className="weather-forecast-btn">Switch City / Forecast →</span>
            </div>
          </div>

          {/* Trending Now Stories */}
          <div className="trending-widget-card">
            <h4 className="widget-title">Trending Now 🔥</h4>
            <div className="trending-list">
              {articles.slice(0, 5).map((a, idx) => (
                <div 
                  key={a.id} 
                  className="trending-widget-item"
                  onClick={() => navigate(`/article/${a.id}`)}
                >
                  <span className="trending-rank">0{idx + 1}</span>
                  <div className="trending-item-details">
                    <p className="trending-headline">{a.title}</p>
                    <span className="trending-source">{a.source || 'News'}</span>
                  </div>
                  {a.image_url && (
                    <img className="trending-thumb" src={a.image_url} alt={a.title} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Saved Articles Widget */}
          <div className="saved-widget-card">
            <div className="widget-header-row">
              <h4 className="widget-title">Saved Articles 🔖</h4>
              <button 
                className="widget-view-all-btn"
                onClick={() => navigate(isGuest ? '/signup' : '/saved')}
              >
                View All
              </button>
            </div>
            
            <div className="saved-widget-list">
              {isGuest ? (
                <div className="saved-widget-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 8px 0' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Sign in to save articles and read them later.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button 
                      className="widget-signup-btn" 
                      onClick={() => navigate('/login')}
                      style={{ flex: 1, margin: 0, padding: '10px' }}
                    >
                      Sign In
                    </button>
                    <button 
                      className="widget-signup-btn" 
                      onClick={() => navigate('/signup')}
                      style={{ 
                        flex: 1, 
                        margin: 0, 
                        padding: '10px', 
                        background: 'var(--slate-100)', 
                        color: 'var(--text-primary)', 
                        border: '1px solid var(--border-color)' 
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              ) : savedArticles.length > 0 ? (

                savedArticles.slice(0, 3).map((a) => (
                  <div 
                    key={a.id} 
                    className="saved-widget-item"
                    onClick={() => navigate(`/article/${a.id}`)}
                  >
                    <img 
                      className="saved-widget-thumb" 
                      src={a.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=150&auto=format&fit=crop'} 
                      alt={a.title} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=150&auto=format&fit=crop'; }}
                    />
                    <div className="saved-widget-info">
                      <p className="saved-widget-headline">{a.title}</p>
                      <span className="saved-widget-source">{a.source}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="saved-widget-empty">
                  <p>No saved articles yet. Bookmark articles from the feed to save them here.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Language Selection Modal */}
      {isLanguagesModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLanguagesModalOpen(false)}>
          <div className="languages-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Choose your Languages</h2>
            <p>Select one or more languages to build your personalized real-time news intelligence feed.</p>
            
            <div className="languages-grid">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = tempLanguages.includes(lang.code);
                return (
                  <div 
                    key={lang.code}
                    className={`lang-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTempLanguage(lang.code)}
                  >
                    <div>
                      <div className="lang-card-native">{lang.native}</div>
                      <div className="lang-card-label">{lang.label}</div>
                    </div>
                    {isSelected && <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#3B82F6' }}>✓</span>}
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setIsLanguagesModalOpen(false)}>
                Cancel
              </button>
              <button className="modal-btn-continue" onClick={saveLanguages}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
