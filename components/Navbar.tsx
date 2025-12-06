import React from 'react';
import { Menu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-surfaceHighlight">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo Image */}
          <img 
            src="/logo.jpg" 
            alt="ProGall Logo" 
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105 rounded-lg" 
          />
          {/* Title - Uses textPrimary so it turns Black in Light Mode */}
          <span className="text-xl font-bold text-textPrimary tracking-tight">ProGall</span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          <button 
            onClick={onToggleSidebar}
            className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
