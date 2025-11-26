import React from 'react';
import { X, Home, Upload, Settings, LogOut, Grid } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isAuthenticated, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/' },
    ...(isAuthenticated ? [
      { icon: <Grid size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: <Upload size={20} />, label: 'Upload New', path: '/admin/dashboard' }, // Shortcut
    ] : [
      { icon: <Settings size={20} />, label: 'Admin Login', path: '/admin/login' }
    ]),
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-72 bg-surface shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-surfaceHighlight ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-surfaceHighlight">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surfaceHighlight text-textSecondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-accent/10 text-accent'
                    : 'text-textSecondary hover:bg-surfaceHighlight hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

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
