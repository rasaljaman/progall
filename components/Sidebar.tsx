import React from 'react';
import { X, Home, Upload, LogOut, Grid, FileText, Shield, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAuthenticated, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  // Helper class to keep code clean
  const linkClass = (path: string) => 
    `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive(path)
        ? 'bg-accent/10 text-accent font-medium'
        : 'text-textSecondary hover:bg-surfaceHighlight hover:text-white'
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
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surfaceHighlight text-textSecondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            
            {/* 1. Main Navigation */}
            <Link to="/" onClick={onClose} className={linkClass('/')}>
              <Home size={20} />
              <span>Home</span>
            </Link>

            {/* 2. Admin Navigation (Only if Logged In) */}
            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-surfaceHighlight/50 mx-2"></div>
                <p className="px-4 text-xs font-semibold text-accent uppercase tracking-wider mb-1 mt-4">Admin Panel</p>
                
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/dashboard')}>
                  <Grid size={20} />
                  <span>Dashboard</span>
                </Link>
                
                {/* Visual shortcut for upload, goes to same dash for now */}
                <Link to="/admin/dashboard" onClick={onClose} className={linkClass('/admin/upload')}>
                  <Upload size={20} />
                  <span>Upload New</span>
                </Link>
              </>
            )}

            {/* 3. Legal & Help Section (Always Visible) */}
            <div className="my-4 border-t border-surfaceHighlight/50 mx-2"></div>
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal & Help</p>

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

          {/* Footer / Logout Area */}
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
