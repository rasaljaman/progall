import React from 'react';
import { Menu, Home, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 w-full h-16 bg-background/90 backdrop-blur-md border-b border-surfaceHighlight flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {isHome ? (
          <Link to="/" className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors text-textSecondary hover:text-white">
            <Home size={20} />
          </Link>
        ) : (
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors text-textSecondary hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-bold tracking-tight text-white select-none">ProGall</h1>
      </div>

      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-full hover:bg-surfaceHighlight transition-colors text-textSecondary hover:text-white"
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>
    </nav>
  );
};

export default Navbar;
