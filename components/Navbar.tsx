import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      // Smart Scroll Logic:
      // Hide when scrolling down (if moved more than 10px), Show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); 
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return (
    <>
      {/* FLOATING CAPSULE NAVBAR 
        - Centered horizontally
        - Fixed at the top
        - Pill shape (rounded-full)
        - Glassmorphism effect
      */}
      <nav 
        className={`
          fixed z-50 
          left-4 right-4                  /* Mobile: 16px margins */
          md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] /* Desktop: Centered, fixed width */
          transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          ${isVisible ? 'top-6 opacity-100' : '-top-24 opacity-0'} /* Slide in/out logic */
        `}
      >
        <div className="
          flex items-center justify-between 
          h-14 px-2 pl-5 pr-2
          bg-surface/80 backdrop-blur-xl 
          border border-surfaceHighlight/50 shadow-lg shadow-black/5
          rounded-full
        ">
          
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo */}
            <img 
              src="/logo.jpg" 
              alt="ProGall" 
              className="h-8 w-8 object-cover rounded-full shadow-sm group-hover:scale-105 transition-transform" 
            />
            {/* Title */}
            <span className="text-lg font-bold text-textPrimary tracking-tight">
              ProGall
            </span>
            {/* Optional: Small status dot */}
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-accent animate-pulse ml-1"></span>
          </Link>

          {/* Menu Button (Circular) */}
          <button 
            onClick={onToggleSidebar}
            aria-label="Menu"
            className="
              p-2.5 rounded-full 
              bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textPrimary 
              transition-all active:scale-90
              border border-white/10
            "
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
