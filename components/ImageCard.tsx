import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Download } from 'lucide-react';
import { ImageItem } from '../types';
import { supabaseService } from '../services/supabaseService';

interface ImageCardProps {
  img: ImageItem;
  copiedId?: string | null;
  onCopy?: (e: React.MouseEvent, text: string, id: string) => void;
}

/**
 * Shared image card used in both the Home gallery grid
 * and the Related Images section on the detail page.
 *
 * - aspect-[4/3] for uniform row-first grid
 * - Shimmer skeleton until image loads
 * - Hover overlay with Copy Prompt button
 * - Category badge top-left
 */
const ImageCard: React.FC<ImageCardProps> = ({ img, copiedId, onCopy }) => {
  const [loaded, setLoaded] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);

  const isCopied = copiedId ? copiedId === img.id : localCopied;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCopy) {
      onCopy(e, img.prompt, img.id);
    } else {
      navigator.clipboard.writeText(img.prompt);
      supabaseService.trackEvent('COPY_PROMPT', { image_id: img.id });
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2000);
    }
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-border/40 bg-surface hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">

      {/* Shimmer until loaded */}
      {!loaded && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}

      <Link to={`/image/${img.id}`} className="block">
        {/* Fixed aspect ratio box */}
        <div className="aspect-[4/3] overflow-hidden bg-surfaceHighlight">
          <img
            src={img.thumbnail || img.url}
            alt={img.prompt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-end p-3.5">
          <p className="text-white text-xs line-clamp-3 mb-3 leading-relaxed font-medium drop-shadow-md">
            "{img.prompt}"
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isCopied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/95 text-zinc-900 hover:bg-white'
              }`}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied!' : 'Copy Prompt'}
            </button>
            {!!img.downloads_count && (
              <div className="flex flex-col items-center text-white/80 text-[10px] gap-0.5 drop-shadow">
                <Download size={13} />
                <span>{img.downloads_count}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Category badge */}
      {img.category && (
        <div className="absolute top-2.5 left-2.5 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm border border-white/10">
            {img.category}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
