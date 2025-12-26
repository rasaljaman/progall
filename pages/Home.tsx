import React, { useState, useEffect, useMemo, useRef } from 'react';
import Carousel from '../components/Carousel'; // Restored Import
import { supabaseService } from '../services/supabaseService';
import { ImageItem, SortOption } from '../types';
import { Search, X, Copy, Check, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  // --- STATE ---
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Categories (Incremental Loading)
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dynamicCategories, setDynamicCategories] = useState<{name: string, count: number}[]>([]);
  const [categoryLimit, setCategoryLimit] = useState(10); // Start with 10 tags
  
  // UX State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- 1. INITIAL LOAD & ANALYTICS SORTING ---
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getImages();
        
        // Sort by Popularity Score (Downloads > Copies > Views)
        // If no stats exist, it falls back to Creation Date implicitly via logic
        const sortedData = data.sort((a, b) => {
          const scoreA = ((a.downloads_count || 0) * 3) + ((a.copies_count || 0) * 2) + ((a.views_count || 0) * 1);
          const scoreB = ((b.downloads_count || 0) * 3) + ((b.copies_count || 0) * 2) + ((b.views_count || 0) * 1);
          return scoreB - scoreA;
        });

        setImages(sortedData);

        // Extract & Sort Categories
        if (data.length > 0) {
          const catCounts: Record<string, number> = {};
          data.forEach(img => {
            catCounts[img.category] = (catCounts[img.category] || 0) + 1;
          });
          
          const sortedCats = Object.entries(catCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([name, count]) => ({ name, count }));
            
          setDynamicCategories([{ name: 'All', count: data.length }, ...sortedCats]);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // --- 2. DEBOUNCED SEARCH ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      if (inputValue.length > 2) supabaseService.trackEvent('SEARCH', { term: inputValue });
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // --- 3. FILTER LOGIC & FEATURED ---
  
  // Featured Images (For Carousel) - Restored
  const featuredImages = useMemo(() => {
    const featured = images.filter(img => img.is_featured === true);
    // If no featured images, take top 5 sorted by popularity
    return featured.length > 0 ? featured : images.slice(0, 5);
  }, [images]);

  // Filtered Images (For Grid)
  const filteredImages = useMemo(() => {
    let result = [...images];

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(img => 
          img.prompt.toLowerCase().includes(q) || img.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(img => img.category === selectedCategory);
    }

    return result;
  }, [images, debouncedQuery, selectedCategory]);

  // --- 4. CATEGORY PAGINATION LOGIC ---
  const visibleCategories = dynamicCategories.slice(0, categoryLimit);
  
  const handleShowMoreCategories = () => {
    if (categoryLimit >= dynamicCategories.length) {
      setCategoryLimit(10); // Reset
    } else {
      setCategoryLimit(prev => prev + 10); // Show next 10
    }
  };

  // --- 5. HANDLERS ---
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
      
      {/* --- SECTION 1: CAROUSEL (Restored) --- */}
      <section className="mb-6">
        {loading ? (
          // Carousel Skeleton
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="w-full h-64 md:h-96 bg-surfaceHighlight rounded-2xl animate-pulse border border-white/5 shadow-xl"></div>
          </div>
        ) : (
          featuredImages.length > 0 && <Carousel images={featuredImages} />
        )}
      </section>

      {/* --- SECTION 2: SEO / INTRO TEXT (Restored) --- */}
      <section className="max-w-4xl mx-auto px-4 text-center mb-6 mt-6">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-3">
          Discover the Best AI Art Prompts
        </h1>
        <p className="text-textSecondary text-sm md:text-base leading-relaxed">
          Browse our extensive gallery of high-quality AI-generated images. 
          Copy exact prompts for Midjourney, Stable Diffusion, and DALL-E to recreate 
          stunning styles in Anime, Cyberpunk, 3D Render, and Photorealistic aesthetics.
        </p>
      </section>

      {/* --- SECTION 3: STICKY HEADER (Search & Categories) --- */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-white/5 shadow-md transition-all">
        
        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
            <input
              type="text"
              placeholder="Search prompts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-surfaceHighlight border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent outline-none"
            />
             {inputValue && (
               <button onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary">
                  <X size={16} />
               </button>
            )}
          </div>
        </div>

        {/* Categories (Wrapping + Pagination) */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            
            {visibleCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2
                  ${selectedCategory === cat.name 
                    ? 'bg-accent text-white border-accent' 
                    : 'bg-surfaceHighlight text-textSecondary border-white/5 hover:bg-surfaceHighlight/80 hover:text-white'}
                `}
              >
                {cat.name}
                <span className="opacity-50 text-[10px] bg-black/20 px-1.5 rounded-full">{cat.count}</span>
              </button>
            ))}

            {/* "Show More" Button */}
            {dynamicCategories.length > 10 && (
              <button
                onClick={handleShowMoreCategories}
                className="px-3 py-1.5 rounded-md text-xs font-bold border bg-surfaceHighlight text-accent border-accent/20 hover:bg-surfaceHighlight/80 hover:border-accent/50 flex items-center gap-1 transition-all"
              >
                {categoryLimit >= dynamicCategories.length ? (
                  <>Show Less <ChevronUp size={12} /></>
                ) : (
                  <>+{Math.min(10, dynamicCategories.length - categoryLimit)} More <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 4: MAIN GRID (Masonry) --- */}
      <main className="max-w-7xl mx-auto px-4 mt-6 min-h-[60vh]">
        {loading ? (
          // Grid Skeletons (Matches Masonry Layout)
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surfaceHighlight rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          // 1 col mobile, 3 tablet, 4 desktop
          <div className="columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredImages.map((img) => (
              <div key={img.id} className="break-inside-avoid relative group mb-4">
                
                <Link to={`/image/${img.id}`} className="block relative overflow-hidden rounded-xl bg-surfaceHighlight">
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    loading="lazy"
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* HOVER OVERLAY: Translucent + Text Visible */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                    
                    {/* Prompt Preview */}
                    <p className="text-white text-sm line-clamp-4 mb-4 leading-relaxed font-medium drop-shadow-md">
                      "{img.prompt}"
                    </p>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3">
                       <button
                        onClick={(e) => handleCopy(e, img.prompt, img.id)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                            copiedId === img.id 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                       >
                         {copiedId === img.id ? <Check size={16} /> : <Copy size={16} />}
                         {copiedId === img.id ? 'Copied' : 'Copy'}
                       </button>

                       {/* Stats Badge */}
                       {(img.downloads_count || img.copies_count) && (
                           <div className="text-xs text-white flex flex-col items-center px-1 drop-shadow-md">
                               <Download size={14} />
                               <span>{img.downloads_count || 0}</span>
                           </div>
                       )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
