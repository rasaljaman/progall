import React, { useState, useEffect } from 'react';
import { X, Home, Upload, LogOut, Grid, FileText, Shield, Mail, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAuthenticated, onLogout }) => {
  const location = useLocation();
  
  // 1. THEME STATE
  const [isDark, setIsDark] = useState(true);

  // 2. CHECK PREFERENCE ON LOAD
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark unless user explicitly chose light
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // 3. TOGGLE FUNCTION
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  const linkClass = (path: string) => 
    `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive(path)
        ? 'bg-accent/10 text-accent font-medium'
        : 'text-textSecondary hover:bg-surfaceHighlight hover:text-textPrimary'
    }`;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel (Right Side) */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-72 bg-surface shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-surfaceHighlight ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surfaceHighlight">
            <span className="text-lg font-bold text-textPrimary">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            
            {/* --- THEME TOGGLE BUTTON --- */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surfaceHighlight/50 border border-surfaceHighlight text-textPrimary hover:bg-surfaceHighlight transition-all mb-6"
            >
              <div className="flex items-center gap-3">
                {isDark ? <Moon size={20} className="text-accent" /> : <Sun size={20} className="text-accentAmber" />}
                <span className="font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              {/* Visual Switch */}
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? 'bg-accent/30' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isDark ? 'left-6 bg-accent' : 'left-1'}`} />
              </div>
            </button>
            
            {/* 1. Main Navigation */}
            <Link to="/" onClick={onClose} className={linkClass('/')}>
              <Home size={20} />
              <span>Home</span>
            </Link>

            {/* 2. Admin Navigation */}
            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-surfaceHighlight/50 mx-2"></div>
                <p className="px-4 text-xs font-semibold text-accent uppercase tracking-wider mb-1 mt-4">Admin Panel</p>
                
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/dashboard')}>
                  <Grid size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/upload')}>
                  <Upload size={20} />
                  <span>Upload New</span>
                </Link>
              </>
            )}

            {/* 3. Legal & Help Section */}
            <div className="my-4 border-t border-surfaceHighlight/50 mx-2"></div>
            <p className="px-4 text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Legal & Help</p>

            <Link to="/terms" onClick={onClose} className={linkClass('/terms')}>
              <FileText size={20} />
              <span>Terms of Use</span>
            </Link>

            <Link to="/privacy" onClick={onClose} className={linkClass('/privacy')}>
              <Shield size={20} />
              <span>Privacy Policy</span>
            </Link>

            <Link to="/contact" onClick={onClose} className={linkClass('/contact')}>
              <Mail size={20} />
              <span>Contact Us</span>
            </Link>

          </div>

          {/* Footer / Logout */}
          {isAuthenticated && (
            <div className="p-4 border-t border-surfaceHighlight">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-4 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
