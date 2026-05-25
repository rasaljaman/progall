import React, { useState, useEffect, useMemo } from 'react';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import ImageCard from '../components/ImageCard';
import ImageCardSkeleton from '../components/ImageCardSkeleton';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import {
  Search, X, ChevronDown, ChevronUp,
  Sparkles, BookOpen, Zap, Twitter
} from 'lucide-react';
import TwitterPromptGallery from '../components/TwitterPromptGallery';

// ---------------------------------------------------------------------------
// Home page — uniform aspect ratio grid, no gaps, newest-first, row-fill
// ---------------------------------------------------------------------------
const INITIAL_SLOTS = 32;   // 4 cols × 8 rows
const LOAD_MORE_SLOTS = 16; // 4 cols × 4 rows

interface UnifiedPrompt {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  category: string;
  tags: string[];
  likes: number;
  views: number;
  is_twitter: boolean;
  author?: string;
  handle?: string;
  created_at: string;
}

const Home: React.FC = () => {
  const [images,    setImages]    = useState<UnifiedPrompt[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [inputValue,       setInputValue]       = useState('');
  const [debouncedQuery,   setDebouncedQuery]   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dynamicCategories, setDynamicCategories] = useState<{name: string; count: number}[]>([]);
  const [categoryLimit,    setCategoryLimit]    = useState(10);
  const [slotLimit,        setSlotLimit]        = useState(INITIAL_SLOTS);
  const [copiedId,         setCopiedId]         = useState<string | null>(null);

  // ── FETCH ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAllPrompts = async () => {
      setLoading(true);
      try {
        const [galleryData, twitterData] = await Promise.all([
          supabaseService.getImages(),
          supabaseService.getTwitterPrompts()
        ]);

        const mappedGallery: UnifiedPrompt[] = galleryData.map(img => ({
          id: img.id,
          url: img.url,
          thumbnail: img.thumbnail || img.url,
          prompt: img.prompt,
          category: img.category || 'Gallery',
          tags: img.tags || [],
          likes: img.copies_count || img.downloads_count || 0,
          views: img.views_count || 0,
          is_twitter: false,
          created_at: img.created_at || new Date().toISOString()
        }));

        const mappedTwitter: UnifiedPrompt[] = twitterData.map(item => ({
          id: item.id,
          url: item.image_urls?.[0] || '',
          thumbnail: item.image_urls?.[0] || '',
          prompt: item.prompt_text,
          category: item.model || 'Twitter',
          tags: [],
          likes: item.likes || 0,
          views: item.views || 0,
          is_twitter: true,
          author: item.author,
          handle: item.handle,
          created_at: item.tweeted_at || item.created_at || new Date().toISOString()
        }));

        const combined = [...mappedGallery, ...mappedTwitter]
          .sort((a, b) => b.likes - a.likes);

        setImages(combined);

        if (combined.length > 0) {
          const catCounts: Record<string, number> = {};
          combined.forEach(img => { catCounts[img.category] = (catCounts[img.category] || 0) + 1; });
          const sorted = Object.entries(catCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count }));
          setDynamicCategories([{ name: 'All', count: combined.length }, ...sorted]);
        }
      } catch (err) {
        console.error('Error fetching prompts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPrompts();
  }, []);

  // ── DEBOUNCED SEARCH ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue.length > 2) supabaseService.trackEvent('SEARCH', { term: inputValue });
    }, 500);
    return () => clearTimeout(t);
  }, [inputValue]);

  // ── RESET SLOTS on filter change ──────────────────────────────────────────
  useEffect(() => { setSlotLimit(INITIAL_SLOTS); }, [debouncedQuery, selectedCategory]);

  // ── FILTER ────────────────────────────────────────────────────────────────
  const allFiltered = useMemo(() => {
    let result = [...images];
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(img =>
        img.prompt.toLowerCase().includes(q) ||
        img.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(img => img.category === selectedCategory);
    }
    return result;
  }, [images, debouncedQuery, selectedCategory]);

  // Show complete rows only — always multiples of 4 (no partial last row)
  const visibleCount   = Math.min(Math.floor(Math.min(slotLimit, allFiltered.length) / 4) * 4, allFiltered.length);
  const visibleImages  = allFiltered.slice(0, visibleCount);
  const visibleCategories = dynamicCategories.slice(0, categoryLimit);
  const hasMore = allFiltered.length > slotLimit;

  const handleShowMoreCats = () => {
    if (categoryLimit >= dynamicCategories.length) setCategoryLimit(10);
    else setCategoryLimit(prev => prev + 10);
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    supabaseService.trackEvent('COPY_PROMPT', { image_id: id });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen pb-20 bg-background text-textPrimary page-enter">
      <SEO
        title="Home"
        description="The premium gallery for AI art prompts. Copy exact prompts for Midjourney, Stable Diffusion, and DALL-E."
      />

      <Hero images={images} totalCount={images.length} />

      {/* ── Sticky Search + Category Bar ── */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary" size={16} />
            <input
              type="text"
              placeholder="Search prompts, styles, or categories…"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-full bg-surfaceHighlight border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-textSecondary/50 transition-all"
            />
            {inputValue && (
              <button onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {visibleCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-surfaceHighlight text-textSecondary border-border/60 hover:border-accent/40 hover:text-textPrimary'
                }`}
              >
                {cat.name}
                <span className="ml-1.5 opacity-60">{cat.count}</span>
              </button>
            ))}
            {dynamicCategories.length > 10 && (
              <button
                onClick={handleShowMoreCats}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 transition-all flex items-center gap-1"
              >
                {categoryLimit >= dynamicCategories.length
                  ? <><ChevronUp size={12} /> Less</>
                  : <><ChevronDown size={12} /> +{Math.min(10, dynamicCategories.length - categoryLimit)} More</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      <main id="gallery-section" className="max-w-7xl mx-auto px-4 mt-6 min-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 32 }).map((_, i) => <ImageCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {/*
              Uniform aspect-[2/3] grid:
              - All cards same shape → rows always perfectly uniform, zero gaps
              - object-fit:cover fills each card completely (minimal crop)
              - visibleCount is always a multiple of 4 → last row always full
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {visibleImages.map((img, idx) => (
                <ImageCard
                  key={img.id}
                  img={img as any}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  index={idx}
                  aspectType="vertical"
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12 mb-6">
                <button
                  onClick={() => setSlotLimit(prev => prev + LOAD_MORE_SLOTS)}
                  className="group flex items-center gap-2 px-8 py-3 rounded-full bg-surfaceHighlight text-textPrimary text-sm font-semibold border border-border transition-all hover:shadow-md"
                >
                  Load More
                  <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}

            {allFiltered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-textSecondary gap-3">
                <Search size={40} className="opacity-20" />
                <p className="text-base font-medium">No prompts found</p>
                <p className="text-sm opacity-60">Try a different search or category</p>
              </div>
            )}
          </>
        )}
      </main>



      {/* ── Content Footer ── */}
      <section className="bg-surface border-t border-border/40 mt-16 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

          <div className="space-y-3">
            <div className="bg-accent/10 w-11 h-11 rounded-xl flex items-center justify-center text-accent">
              <Sparkles size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Master Prompt Engineering</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              Prompt engineering is the fundamental skill required to communicate with cutting-edge AI models. Whether generating game assets, designing websites, or exploring creative visions, output quality depends entirely on input quality.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Our gallery acts as a masterclass. Study how lighting (e.g., <em>"dramatic rim lighting"</em>), angles (e.g., <em>"low angle, ultra-wide lens"</em>), and Midjourney flags like <code className="text-accent text-xs bg-accent/10 px-1 rounded">--ar 16:9</code> and <code className="text-accent text-xs bg-accent/10 px-1 rounded">--style raw</code> shape the final result.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-purple-500/10 w-11 h-11 rounded-xl flex items-center justify-center text-purple-500">
              <BookOpen size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Copy, Paste, Create</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              ProGall eliminates "blank canvas syndrome." Every image comes paired with its complete, unedited prompt. One click copies it directly to your clipboard — ready for Midjourney, DALL-E 3, Stable Diffusion, or Gemini.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Use prompts as starting points. Swap <em>"cyberpunk metropolis"</em> for <em>"serene elven forest"</em> and watch the AI adapt the lighting and composition instantly.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-orange-500/10 w-11 h-11 rounded-xl flex items-center justify-center text-orange-500">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Daily Inspiration</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              The AI landscape evolves rapidly. We continuously update our gallery with fresh styles: Anime, Hyper-realism, 3D Rendering, Watercolor, Vector Illustration, and Isometric Art.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Midjourney excels at textures; DALL-E 3 follows literal instructions; Gemini offers rapid iteration; Stable Diffusion gives granular control. ProGall helps you see the strengths of each platform visually.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
