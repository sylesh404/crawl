import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UserLogin from './pages/UserLogin.jsx';
import Signup from './pages/Signup.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Home from './pages/Home.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import SavedArticles from './pages/SavedArticles.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function RequireUser({ children }) {
  const token = localStorage.getItem('crawlnews_user_token');
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('crawlnews_admin_token');
  return token ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* --- Public user auth routes --- */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* --- Admin auth --- */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

        {/* --- User app (guests allowed on Home, but not saved/dashboard) --- */}
        <Route path="/home" element={<Home />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/saved" element={<RequireUser><SavedArticles /></RequireUser>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
