import React from 'react';
import { Heart } from 'lucide-react'; // Removed Instagram import
import { Link } from 'react-router-dom';

// 1. Import the PNG icons from the new folder
// Since we are in 'components/', we go up one level (../) then into 'icon/'
import instaIcon from '../icon/inta_icon.png';
import threadsIcon from '../icon/thr_icon.png';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface border-t border-surfaceHighlight mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">ProGall</h3>
            <p className="text-sm text-textSecondary leading-relaxed">
              Empowering creators with AI-driven inspiration. Your premier destination for high-quality prompts and visual storytelling assets.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-textSecondary">
              <li><Link to="/" className="hover:text-accent transition-colors">Gallery</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-textSecondary">
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Socials */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              {/* Instagram Link */}
              <a 
                href="https://www.instagram.com/progall_?igsh=MXh0OHkwbnZsOTE4bg==" 
                target="_blank" 
                rel="noopener noreferrer" 
                // Removed hover:text colors because PNGs have their own colors
                className="bg-surfaceHighlight rounded-full hover:bg-white transition-all"
                aria-label="Instagram"
              >
                {/* 2. Use the imported PNG image. Set width/height to match previous size (20px) */}
                <img src={instaIcon} alt="Instagram" width={30} height={30} />
              </a>

              {/* Threads Link */}
              <a 
                href="https://www.threads.net/@progall_" 
                target="_blank" 
                rel="noopener noreferrer" 
                 // Removed hover:text colors
                className="bg-surfaceHighlight rounded-full hover:bg-white transition-all"
                aria-label="Threads"
              >
                {/* 3. Use the imported PNG image instead of the long SVG block */}
                <img src={threadsIcon} alt="Threads" width={30} height={30} />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-surfaceHighlight pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ProGall. All rights reserved.</p>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
