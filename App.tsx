import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ImageDetail from './pages/ImageDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminGenerator from './pages/AdminGenerator';
import Footer from './components/Footer';

import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ';
import AnalyticsPage from './pages/AnalyticsPage';

import Snowfall from './components/Christmas/Snowfall';
import HolidayGift from './components/Christmas/HolidayGift';
import ChristmasPage from './pages/ChristmasPage';
import CookieConsent from './components/CookieConsent';

import { supabase, supabaseService } from './services/supabaseService';

export type ThemeMode = 'dark' | 'light' | 'system';

// ------------------------------------------------------------
// Apply the actual dark/light class to <html>
// ------------------------------------------------------------
const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
};

// Run IMMEDIATELY (before React mounts) to prevent flash
const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'system';
applyTheme(savedMode);

// ------------------------------------------------------------
const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(savedMode);
  const [isDark, setIsDark] = useState(
    savedMode === 'dark' || (savedMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // CHRISTMAS EVENT TOGGLE
  const ENABLE_EVENT = false;
  const isChristmasSeason = () => {
    if (!ENABLE_EVENT) return false;
    const today = new Date();
    return today.getMonth() === 11 && today.getDate() <= 26;
  };

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
        setIsDark(mq.matches);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSetTheme = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    applyTheme(mode);
    const nowDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(nowDark);
  }, []);

  const toggleTheme = useCallback(() => {
    handleSetTheme(isDark ? 'light' : 'dark');
  }, [isDark, handleSetTheme]);

  const toggleSidebar = () => setIsSidebarOpen(o => !o);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await supabaseService.logout();
    setIsAuthenticated(false);
    closeSidebar();
  };

  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    if (authLoading) return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-textPrimary font-sans selection:bg-accent/20 selection:text-accent relative overflow-x-hidden">

        {isChristmasSeason() && (
          <>
            <Snowfall />
            <HolidayGift />
          </>
        )}

        <Navbar
          onToggleSidebar={toggleSidebar}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          themeMode={themeMode}
          onSetTheme={handleSetTheme}
        />

        <main className="relative z-0 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/image/:id" element={<ImageDetail />} />

            <Route path="/terms"   element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about"   element={<About />} />
            <Route path="/faq"     element={<FAQ />} />

            <Route
              path="/admin/login"
              element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
            />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/generator" element={<ProtectedRoute><AdminGenerator /></ProtectedRoute>} />

            <Route path="/christmas" element={<ChristmasPage />} />
          </Routes>
        </main>

        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
};

export default App;
