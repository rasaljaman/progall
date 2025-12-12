import React, { useState, useRef, useEffect } from 'react';
import { ImageItem } from '../types';
import { Link } from 'react-router-dom';
import { MoreVertical, Copy, Sparkles, Download, Share2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ImageCardProps {
  image: ImageItem;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    setShowMenu(false);

    if (action === 'copy') {
      navigator.clipboard.writeText(image.prompt);
      showToast('Prompt copied to clipboard! ✨');
    }
    if (action === 'remix') {
       const newTab = window.open('https://gemini.google.com/app', '_blank');
       navigator.clipboard.writeText(image.prompt);
       if(!newTab) {
         showToast('Popup blocked. Prompt copied anyway!', 'error');
       } else {
         showToast('Opening Gemini... Prompt copied!');
       }
    }
    if (action === 'share') {
      if (navigator.share) {
        navigator.share({ title: 'ProGall Art', text: image.prompt, url: window.location.href + 'image/' + image.id });
      } else {
        navigator.clipboard.writeText(window.location.href + 'image/' + image.id);
        showToast('Link copied to clipboard!');
      }
    }
    if (action === 'download') {
      window.open(image.url, '_blank');
    }
  };

  return (
    // REMOVED 'mb-4 break-inside-avoid' from here
    <div className="relative group h-full">
      <Link 
        to={`/image/${image.id}`} 
        className="block relative overflow-hidden rounded-xl bg-surfaceHighlight shadow-card hover:shadow-2xl transition-all duration-300"
      >
        {!isLoaded && (
          <div className="absolute inset-0 z-0 bg-surfaceHighlight animate-pulse flex items-center justify-center" />
        )}

        <img
          src={image.thumbnail || image.url}
          alt={image.prompt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-auto object-cover transform transition-all duration-700 ease-in-out relative z-10
            ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'}
          `}
        />

        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>

      <div className="absolute bottom-2 right-2 z-30" ref={menuRef}>
        <button 
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
          className={`p-2 rounded-full backdrop-blur-md border transition-all duration-200 shadow-lg
            ${showMenu ? 'bg-accent text-white border-accent' : 
            'bg-black/30 text-white border-white/20 opacity-0 group-hover:opacity-100 hover:bg-black/50'}
          `}
        >
          <MoreVertical size={16} />
        </button>

        {showMenu && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-surfaceHighlight rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            <div className="py-1">
              <button onClick={(e) => handleAction('copy', e)} className="w-full text-left px-4 py-3 text-sm text-textPrimary hover:bg-surfaceHighlight flex items-center gap-2 transition-colors">
                <Copy size={14} /> Copy Prompt
              </button>
              <button onClick={(e) => handleAction('remix', e)} className="w-full text-left px-4 py-3 text-sm text-textPrimary hover:bg-surfaceHighlight flex items-center gap-2 transition-colors">
                <Sparkles size={14} className="text-purple-500" /> Remix (Gemini)
              </button>
              <button onClick={(e) => handleAction('download', e)} className="w-full text-left px-4 py-3 text-sm text-textPrimary hover:bg-surfaceHighlight flex items-center gap-2 transition-colors">
                <Download size={14} /> Download
              </button>
              <button onClick={(e) => handleAction('share', e)} className="w-full text-left px-4 py-3 text-sm text-textPrimary hover:bg-surfaceHighlight flex items-center gap-2 border-t border-surfaceHighlight transition-colors">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCard;
