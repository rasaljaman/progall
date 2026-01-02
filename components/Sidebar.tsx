import React, { useState, useEffect } from 'react';
import { Home, Grid, FileText, Shield, Mail, Sun, Moon, ChevronRight, BarChart3, Sparkles, LogOut, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  // Helper for active links
  const linkClass = (path: string) => 
    `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
      location.pathname === path
        ? 'bg-accent/10 text-accent font-semibold'
        : 'text-textPrimary hover:bg-surfaceHighlight'
    }`;

  return (
    <>
      {/* 1. Backdrop (Click to close) */}
      <div
        className={`fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 2. Floating "Island" Menu */}
      <aside
        className={`
          fixed z-[70] 
          top-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[400px]
          bg-surface/95 backdrop-blur-2xl border border-surfaceHighlight shadow-2xl rounded-3xl
          overflow-hidden flex flex-col
          transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        `}
        style={{
          // Slide Down + Fade Effect
          opacity: isOpen ? 1 : 0,
          transform: isOpen 
            ? 'translate(-50%, 0) scale(1)' // Centered & Visible (Desktop logic handled by class)
            : 'translate(-50%, -20px) scale(0.95)', // Hidden state
          // Fix for mobile positioning override
          ...(window.innerWidth < 768 ? {
             transform: isOpen ? 'translateY(0)' : 'translateY(-20px)',
             left: '16px', right: '16px', width: 'auto'
          } : {})
        }}
      >
        {/* Header inside the card */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceHighlight/50">
          <span className="text-sm font-bold text-textSecondary uppercase tracking-widest">Menu</span>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-surfaceHighlight hover:bg-black/10 text-textPrimary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[70vh] p-4 space-y-6">
          
          {/* Theme Toggle Segment */}
          <div className="bg-surfaceHighlight/40 p-1 rounded-2xl flex relative">
            <button
              onClick={() => !isDark && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                !isDark ? 'text-textSecondary' : 'bg-surface shadow-sm text-textPrimary'
              }`}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => isDark && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isDark ? 'text-textSecondary' : 'bg-surface shadow-sm text-textPrimary'
              }`}
            >
              <Sun size={16} /> Light
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <Link to="/" onClick={onClose} className={linkClass('/')}>
              <div className="flex items-center gap-3"><Home size={20} /> Home</div>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/dashboard')}>
                  <div className="flex items-center gap-3"><Grid size={20} /> Dashboard</div>
                </Link>
                <Link to="/admin/generator" onClick={onClose} className={linkClass('/admin/generator')}>
                  <div className="flex items-center gap-3"><Sparkles size={20} className="text-amber-500" /> AI Auto-Creator</div>
                </Link>
                <Link to="/admin/analytics" onClick={onClose} className={linkClass('/admin/analytics')}>
                  <div className="flex items-center gap-3"><BarChart3 size={20} /> Analytics</div>
                </Link>
              </>
            )}
          </div>

          {/* Legal / Help */}
          <div className="space-y-1 pt-2 border-t border-surfaceHighlight/50">
             <Link to="/terms" onClick={onClose} className={linkClass('/terms')}>
                <div className="flex items-center gap-3"><FileText size={18} /> Terms</div>
                <ChevronRight size={16} className="opacity-30" />
              </Link>
              <Link to="/privacy" onClick={onClose} className={linkClass('/privacy')}>
                <div className="flex items-center gap-3"><Shield size={18} /> Privacy</div>
                <ChevronRight size={16} className="opacity-30" />
              </Link>
              <Link to="/contact" onClick={onClose} className={linkClass('/contact')}>
                <div className="flex items-center gap-3"><Mail size={18} /> Contact</div>
                <ChevronRight size={16} className="opacity-30" />
              </Link>
          </div>

          {/* Logout */}
          {isAuthenticated && (
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/5 text-red-500 font-semibold hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} /> Log Out
            </button>
          )}

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
