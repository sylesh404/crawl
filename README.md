# CrawlNews

Full-stack news aggregation platform: scrapes RSS sources, cleans & summarizes with
Gemini 2.5 Pro, generates cover images with Luma AI, routes everything through an
agentic approve/reject/rephrase pipeline, and serves a personalized feed to users.

Stack: **React (Vite) + Express + MySQL** (MERN minus Mongo, as requested).

## What's fully wired vs. what's an honest starting point

**Fully working, real logic:**
- User signup with confirmation email → JWT login, guest login (view-only, no save/feed)
- Admin login (separate JWT, separate table) → dashboard with live approve/reject/rejected/rephrase counts
- Real RSS scraping (`rss-parser` + `cheerio` for full-article extraction)
- Real Gemini 2.5 Pro calls for cleaning, fact-check scoring, classification, summaries, SEO, tags
- Real Luma AI calls for cover image generation, with polling
- Rules-based **agentic** approve/reject/rephrase-flagging engine (`pipelineService.js` → `decideStatus()`), fully auditable via `article_status_history`
- Duplicate detection: exact hash match + fuzzy title-token overlap
- Category/subcategory browsing, save/unsave, personalized feed ranking, MySQL schema

**Intentionally simple, built to be upgraded:**
- The "recommendation system" is a transparent weighted formula (interest weight × recency × engagement), not a trained ML model — swap `recommendationService.js` for a real model later without touching any callers.
- "Fact verification" is Gemini's own plausibility judgment plus a cross-source counter, not an independent fact-checking service.
- Analytics rollups (`article_analytics`) are queried live rather than via a separate nightly job — add a cron job in `backend/src/jobs` if you want pre-aggregated rollups at scale.

## 1. Database setup

```bash
mysql -u root -p < database/schema.sql
```
This creates the `crawlnews` database, all tables, and seeds the category tree
(Local/National/International × Sports/Health/AI/Technology/Business/Politics/Entertainment).

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: DB credentials, JWT secrets, SMTP credentials, GEMINI_API_KEY, LUMA_API_KEY
npm run seed:admin            # creates admin@crawlnews.com / Admin@123 (change after first login)
npm run dev                   # starts API on http://localhost:5000
```

To seed a few real sample RSS sources and run one crawl immediately (instead of waiting
for the cron job):
```bash
npm run crawl:once
```
Replace the sample sources in `src/jobs/runCrawlOnce.js` with your vetted, genuine
local/national/international sources before going live.

### Getting API keys
- **Gemini**: https://aistudio.google.com/app/apikey (free tier)
- **Luma AI**: https://lumalabs.ai/dream-machine/api — get an API key from your account dashboard
- **SMTP**: any provider works (Gmail App Password, SendGrid, Mailgun, etc.)

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Visit:
- `http://localhost:5173/login` — user login / signup / guest login
- `http://localhost:5173/admin` — admin login

## Project structure

```
crawlnews/
├── database/schema.sql          # MySQL schema + seed categories
├── backend/
│   └── src/
│       ├── config/db.js         # MySQL pool
│       ├── middleware/auth.js   # JWT guards (user / admin / optional)
│       ├── controllers/         # auth, admin, article route handlers
│       ├── routes/               # Express routers
│       ├── services/
│       │   ├── scraperService.js       # RSS + full-page extraction
│       │   ├── geminiService.js        # cleaning/fact-check/classification/summaries
│       │   ├── lumaService.js          # image generation
│       │   ├── pipelineService.js      # dedup + agentic approve/reject/rephrase decision
│       │   ├── recommendationService.js
│       │   └── emailService.js
│       ├── jobs/runCrawlOnce.js
│       └── utils/seedAdmin.js
└── frontend/
    └── src/
        ├── pages/    (AdminLogin, UserLogin, Signup, Home, ArticleDetail, SavedArticles, AdminDashboard)
        ├── components/
        └── api/axios.js
```

## Data flow (matches your workflow diagram)

```
RSS sources → scraperService (extract) → pipelineService.findDuplicate()
→ geminiService.processArticleWithGemini() (clean, fact-check, classify, summarize, SEO)
→ lumaService.generateArticleImage() → decideStatus() (agentic approve/reject/rephrase-flag)
→ saved as draft/pending_review/rejected/needs_rephrase in `articles`
→ Admin Dashboard (approve / reject / rephrase) → geminiService.rephraseArticle() on rephrase
→ approved + is_published=TRUE → appears on Home feed under its category
→ article_events / article_analytics → recommendationService personalizes future feeds
```

## Notes on scope

This is a genuinely large system, and everything above is real, runnable code, not
pseudocode. The two areas flagged as "intentionally simple" are the parts that in a
production system would normally be their own dedicated ML services (a trained
recommender, an independent fact-checking pipeline) — building those from scratch was
out of scope for a single delivery, but the interfaces are isolated so you (or I, in a
follow-up) can swap in something more sophisticated without touching the rest of the app.
