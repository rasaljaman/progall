import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Copy, Check, Twitter } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { TwitterPrompt } from '../types';
import ImageCardSkeleton from './ImageCardSkeleton';

export const TwitterPromptGallery: React.FC = () => {
  const [prompts, setPrompts] = useState<TwitterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const data = await supabaseService.getTwitterPrompts();
        setPrompts(data);
      } catch (err) {
        console.error('Error fetching Twitter prompts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    supabaseService.trackEvent('COPY_PROMPT_TWITTER', { prompt_id: id });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ImageCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-textSecondary border border-dashed border-border/60 rounded-2xl bg-surface/50">
        <Twitter size={32} className="opacity-35 mb-2 text-accent" />
        <p className="text-sm font-medium text-textPrimary">No community prompts found</p>
        <p className="text-xs opacity-60">Sourced tweets will show up here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {prompts.map((item, idx) => {
        const isCopied = copiedId === item.id;
        const mainImage = item.image_urls?.[0] || '';
        
        return (
          <div
            key={item.id}
            className="animate-fade-up relative group rounded-2xl overflow-hidden border border-border/40 bg-surface hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 aspect-[2/3]"
            style={{ '--card-delay': `${Math.min(idx, 11) * 60}ms` } as React.CSSProperties}
          >
            {/* Link fills the entire card */}
            <Link to={`/prompt/${item.id}`} className="absolute inset-0 block">
              <img
                src={mainImage}
                alt={item.prompt_text}
                loading="lazy"
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />

              {/* Top Meta Info (Model & Handle) */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-none">
                {item.model && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm border border-white/10">
                    {item.model}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white backdrop-blur-sm shadow-sm flex items-center gap-1">
                  <Twitter size={10} className="fill-white text-white" />
                  @{item.handle}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-end p-3.5">
                <p className="text-white text-xs line-clamp-3 mb-3 leading-relaxed font-medium drop-shadow-md">
                  "{item.prompt_text}"
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopy(e, item.prompt_text, item.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      isCopied
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/95 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  
                  {/* Likes Metrics */}
                  <div className="flex flex-col items-center text-white/80 text-[10px] gap-0.5 drop-shadow shrink-0 min-w-[28px]">
                    <Heart size={12} className="fill-white/20 text-white" />
                    <span>{item.likes}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default TwitterPromptGallery;
