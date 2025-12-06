import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import icons (keeping your specific file names)
import instaIcon from '../icon/inta_icon.png';
import threadsIcon from '../icon/thr_icon.png';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface border-t border-surfaceHighlight mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-1">
            {/* FIX: Changed text-white to text-textPrimary */}
            <h3 className="text-xl font-bold text-textPrimary mb-4">ProGall</h3>
            <p className="text-sm text-textSecondary leading-relaxed">
              Empowering creators with AI-driven inspiration. Your premier destination for high-quality prompts and visual storytelling assets.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            {/* FIX: Changed text-white to text-textPrimary */}
            <h4 className="text-textPrimary font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-textSecondary">
              <li><Link to="/" className="hover:text-accent transition-colors">Gallery</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            {/* FIX: Changed text-white to text-textPrimary */}
            <h4 className="text-textPrimary font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-textSecondary">
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Socials */}
          <div>
            {/* FIX: Changed text-white to text-textPrimary */}
            <h4 className="text-textPrimary font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              {/* Instagram Link */}
              <a 
                href="https://www.instagram.com/progall_?igsh=MXh0OHkwbnZsOTE4bg==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-surfaceHighlight rounded-full hover:bg-white transition-all"
                aria-label="Instagram"
              >
                <img src={instaIcon} alt="Instagram" width={30} height={30} />
              </a>

              {/* Threads Link */}
              <a 
                href="https://www.threads.net/@progall_" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-surfaceHighlight rounded-full hover:bg-white transition-all"
                aria-label="Threads"
              >
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
