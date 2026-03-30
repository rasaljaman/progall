import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isDark, onToggleTheme }) => {
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y < 20);
      if (y > lastY && y > 60) setVisible(false);
      else setVisible(true);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  return (
    <nav
      className={`
        fixed z-50
        left-4 right-4
        md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[640px]
        transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${visible ? 'top-5 opacity-100' : '-top-24 opacity-0'}
      `}
    >
      <div
        className={`
          flex items-center justify-between
          h-14 px-3 pl-4
          rounded-full
          border transition-all duration-300
          ${atTop
            ? 'bg-surface/70 backdrop-blur-xl border-border/60 shadow-sm'
            : 'bg-surface/90 backdrop-blur-2xl border-border shadow-lg shadow-black/5'
          }
        `}
      >
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="ProGall"
              className="h-8 w-8 object-cover rounded-full shadow ring-2 ring-accent/20 group-hover:ring-accent/50 transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface" />
          </div>
          <span className="text-base font-bold text-textPrimary tracking-tight">
            Pro<span className="text-gradient">Gall</span>
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-full text-textSecondary hover:text-textPrimary hover:bg-surfaceHighlight transition-all active:scale-90"
          >
            {isDark
              ? <Sun size={18} strokeWidth={2} />
              : <Moon size={18} strokeWidth={2} />
            }
          </button>

          {/* Menu */}
          <button
            onClick={onToggleSidebar}
            aria-label="Open menu"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surfaceHighlight hover:bg-border text-textPrimary text-sm font-semibold transition-all active:scale-95 border border-border/50"
          >
            <Menu size={16} strokeWidth={2.5} />
            <span className="hidden sm:block">Menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
