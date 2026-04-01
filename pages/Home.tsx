import React, { useState, useEffect, useMemo } from 'react';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import ImageCard from '../components/ImageCard';
import ImageCardSkeleton from '../components/ImageCardSkeleton';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import {
  Search, X, ChevronDown, ChevronUp,
  Sparkles, BookOpen, Zap
} from 'lucide-react';
import AdCard from '../components/AdCard';

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
const SKELETON_COUNT = 12;

const Home: React.FC = () => {
  const [images,    setImages]    = useState<ImageItem[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Search & Filter
  const [inputValue,       setInputValue]       = useState('');
  const [debouncedQuery,   setDebouncedQuery]   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Category UI
  const [dynamicCategories, setDynamicCategories] = useState<{name: string; count: number}[]>([]);
  const [categoryLimit,     setCategoryLimit]     = useState(10);

  // Pagination
  const [imageLimit, setImageLimit] = useState(30);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── 1. FETCH — already ordered newest-first by Supabase (created_at DESC) ──
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getImages(); // newest first from API

        setImages(data);

        if (data.length > 0) {
          const catCounts: Record<string, number> = {};
          data.forEach(img => {
            catCounts[img.category] = (catCounts[img.category] || 0) + 1;
          });
          const sorted = Object.entries(catCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count }));
          setDynamicCategories([{ name: 'All', count: data.length }, ...sorted]);
        }
      } catch (err) {
        console.error('Error fetching images:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // ── 2. DEBOUNCED SEARCH ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue.length > 2) supabaseService.trackEvent('SEARCH', { term: inputValue });
    }, 500);
    return () => clearTimeout(t);
  }, [inputValue]);

  // ── 3. RESET PAGINATION on filter change ──
  useEffect(() => { setImageLimit(30); }, [debouncedQuery, selectedCategory]);

  // ── 4. FILTER ──
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

  const visibleImages     = allFiltered.slice(0, imageLimit);
  const visibleCategories = dynamicCategories.slice(0, categoryLimit);

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

      {/* ── Hero ── */}
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
              <button
                onClick={() => setInputValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
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

      {/* ── Gallery Grid (row-first, newest first) ── */}
      <main id="gallery-section" className="max-w-7xl mx-auto px-4 mt-6 min-h-[60vh]">
        {loading ? (
          /* Initial full-page skeleton — same grid as the real grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ImageCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Real grid — 2→3→4 columns, row-first */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {visibleImages.map((img, index) => (
                <React.Fragment key={img.id}>
                  <ImageCard img={img} copiedId={copiedId} onCopy={handleCopy} index={index} />

                  {/* Ad injection after every 11th image */}
                  {(index + 1) % 12 === 0 && (
                    <AdCard />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Load More */}
            {allFiltered.length > imageLimit && (
              <div className="flex justify-center mt-12 mb-6">
                <button
                  onClick={() => setImageLimit(prev => prev + 30)}
                  className="group flex items-center gap-2 px-8 py-3 rounded-full bg-surfaceHighlight hover:bg-bordertext-textPrimary text-sm font-semibold border border-border transition-all hover:shadow-md"
                >
                  Load More
                  <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Empty state */}
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

      {/* ── Content Footer (AdSense + SEO) ── */}
      <section className="bg-surface border-t border-border/40 mt-16 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

          <div className="space-y-3">
            <div className="bg-accent/10 w-11 h-11 rounded-xl flex items-center justify-center text-accent">
              <Sparkles size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Master Prompt Engineering</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              Prompt engineering is no longer just a trend; it is the fundamental skill required to communicate with cutting-edge AI models. Whether you are generating assets for a game, designing a website, or simply exploring creative visions, the quality of your output is entirely dependent on the quality of your input (your prompt). 
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Our gallery acts as a masterclass. By studying the exact phrasing, structure, and parameters used to create stunning visuals, you can learn how to control lighting (e.g., <em>"dramatic rim lighting"</em>), camera angles (e.g., <em>"low angle, ultra-wide lens"</em>), and stylistic nuances. For Midjourney users, we include precise flags like <code className="text-accent text-xs bg-accent/10 px-1 rounded">--ar 16:9</code> (aspect ratio), <code className="text-accent text-xs bg-accent/10 px-1 rounded">--v 6.0</code> (version), and <code className="text-accent text-xs bg-accent/10 px-1 rounded">--style raw</code>.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Beyond just the subject matter, the best prompts incorporate environmental context and mood. Instead of "a car," experienced creators write: <em>"A vintage Porsche 911 driving through a neon-lit cyberpunk metropolis during a heavy rainstorm, cinematic lighting, photorealistic, 8k resolution, Unreal Engine 5 render."</em>
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-purple-500/10 w-11 h-11 rounded-xl flex items-center justify-center text-purple-500">
              <BookOpen size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Copy, Paste, Create: The Ultimate Resource</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              ProGall is designed specifically to eliminate "blank canvas syndrome." We understand the frustration of staring at an empty chat box, unsure of how to articulate the image you see in your mind. That is why every single image in our gallery comes paired with its complete, unedited prompt. 
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              With a single click on the <strong className="text-textPrimary">"Copy Prompt"</strong> button, the exact text is copied to your clipboard. You can then paste it directly into Discord for Midjourney, the Microsoft Designer interface for DALL-E 3, the Stable Diffusion WebUI, or the Google Gemini chat prompt.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              The flexibility of our platform allows you to use these prompts as starting points. Once pasted, simply swap out subjects or settings to instantly generate your own unique piece of artwork. For example, change <em>"a neon-lit cyberpunk metropolis"</em> to <em>"a serene elven forest"</em> and watch the AI seamlessly adapt the lighting and composition to your new vision. It is the fastest way to get exactly what you want.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-orange-500/10 w-11 h-11 rounded-xl flex items-center justify-center text-orange-500">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-textPrimary">Daily Inspiration & Platform Nuances</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              The AI landscape evolves rapidly. What works for Midjourney v5 might act differently in DALL-E 3 or Stable Diffusion XL. We continuously update our generative AI gallery with fresh, daily inspiration covering all the major trending styles: Anime, Hyper-realism, 3D Rendering, Watercolor, Vector Illustration, and Isometric Art.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              Understanding the differences between platforms is crucial. Midjourney excels at artistic interpretations and highly detailed textures; DALL-E 3 is unparalleled in its strict adherence to complex, literal instructions; Google Gemini offers excellent creative brainstorming and rapid iteration; while Stable Diffusion offers granular control for power users.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed pt-2">
              By exploring ProGall, you can visually see the strengths of each model. We encourage you to bookmark our site, share your findings, and return daily to stay ahead of the generative AI curve. Whether you are a professional graphic designer, an indie game developer, or a hobbyist, ProGall is the definitive gallery for elevating your AI creations.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
