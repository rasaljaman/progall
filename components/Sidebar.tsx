import React from 'react';
import {
  Home, Grid, FileText, Shield, Mail,
  Sun, Moon, Monitor, ChevronRight,
  BarChart3, Sparkles, LogOut, X, HelpCircle, Info
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeMode } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  themeMode: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, isAuthenticated, onLogout, themeMode, onSetTheme
}) => {
  const location = useLocation();

  const linkClass = (path: string) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group ${
      location.pathname === path
        ? 'bg-accent/10 text-accent font-semibold'
        : 'text-textPrimary hover:bg-surfaceHighlight'
    }`;

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'dark',   label: 'Dark',   icon: <Moon size={15} /> },
    { mode: 'system', label: 'System', icon: <Monitor size={15} /> },
    { mode: 'light',  label: 'Light',  icon: <Sun size={15} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          isOpen ? 'bg-black/30 backdrop-blur-sm pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`
          fixed z-[70]
          top-[76px] left-4 right-4
          md:left-auto md:right-6 md:w-[340px]
          bg-surface/95 backdrop-blur-2xl
          border border-border
          shadow-2xl shadow-black/20
          rounded-3xl overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <span className="text-xs font-bold text-textSecondary uppercase tracking-[0.1em]">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[75vh] p-4 space-y-5">

          {/* ── Theme Switcher ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-textSecondary mb-2.5 px-1">Appearance</p>
            <div className="flex bg-surfaceHighlight/60 p-1 rounded-2xl gap-1">
              {themeOptions.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => onSetTheme(mode)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                    ${themeMode === mode
                      ? 'bg-surface text-textPrimary shadow-sm ring-1 ring-border/50'
                      : 'text-textSecondary hover:text-textPrimary'
                    }
                  `}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main Nav ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-textSecondary mb-2.5 px-1">Explore</p>
            <div className="space-y-0.5">
              <Link to="/" onClick={onClose} className={linkClass('/')}>
                <div className="flex items-center gap-3"><Home size={18} /> Home</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
              <Link to="/about" onClick={onClose} className={linkClass('/about')}>
                <div className="flex items-center gap-3"><Info size={18} /> About</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
              <Link to="/faq" onClick={onClose} className={linkClass('/faq')}>
                <div className="flex items-center gap-3"><HelpCircle size={18} /> FAQ</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* ── Admin Nav ── */}
          {isAuthenticated && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-textSecondary mb-2.5 px-1">Admin</p>
              <div className="space-y-0.5">
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/dashboard')}>
                  <div className="flex items-center gap-3"><Grid size={18} /> Dashboard</div>
                  <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
                </Link>
                <Link to="/admin/generator" onClick={onClose} className={linkClass('/admin/generator')}>
                  <div className="flex items-center gap-3"><Sparkles size={18} className="text-amber-400" /> AI Auto-Creator</div>
                  <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
                </Link>
                <Link to="/admin/analytics" onClick={onClose} className={linkClass('/admin/analytics')}>
                  <div className="flex items-center gap-3"><BarChart3 size={18} /> Analytics</div>
                  <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
                </Link>
              </div>
            </div>
          )}

          {/* ── Legal ── */}
          <div className="border-t border-border/40 pt-4">
            <div className="space-y-0.5">
              <Link to="/terms" onClick={onClose} className={linkClass('/terms')}>
                <div className="flex items-center gap-3 text-sm"><FileText size={16} /> Terms of Service</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
              <Link to="/privacy" onClick={onClose} className={linkClass('/privacy')}>
                <div className="flex items-center gap-3 text-sm"><Shield size={16} /> Privacy Policy</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
              <Link to="/contact" onClick={onClose} className={linkClass('/contact')}>
                <div className="flex items-center gap-3 text-sm"><Mail size={16} /> Contact</div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-50 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* ── Logout ── */}
          {isAuthenticated && (
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/8 text-red-500 font-semibold text-sm hover:bg-red-500/15 transition-colors border border-red-500/10"
            >
              <LogOut size={16} /> Log Out
            </button>
          )}

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
