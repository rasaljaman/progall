import React, { useState, useEffect, useMemo } from 'react';
import SEO from '../components/SEO';
import Carousel from '../components/Carousel';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import { Search, X, Copy, Check, ChevronDown, ChevronUp, Download, Sparkles, BookOpen, Zap } from 'lucide-react'; // Added icons
import { Link } from 'react-router-dom';
import AdCard from '../components/AdCard';

const Home: React.FC = () => {
  // --- STATE ---
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Category Logic
  const [dynamicCategories, setDynamicCategories] = useState<{name: string, count: number}[]>([]);
  const [categoryLimit, setCategoryLimit] = useState(10); 
  
  // Image Pagination Logic
  const [imageLimit, setImageLimit] = useState(30);

  // UX State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- 1. INITIAL LOAD & ANALYTICS SORTING ---
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getImages();
        
        // Sort by Popularity
        const sortedData = data.sort((a, b) => {
          const scoreA = ((a.downloads_count || 0) * 3) + ((a.copies_count || 0) * 2) + ((a.views_count || 0) * 1);
          const scoreB = ((b.downloads_count || 0) * 3) + ((b.copies_count || 0) * 2) + ((b.views_count || 0) * 1);
          return scoreB - scoreA;
        });

        setImages(sortedData);

        // Extract Categories
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

  // --- 3. RESET PAGINATION ---
  useEffect(() => {
    setImageLimit(30);
  }, [debouncedQuery, selectedCategory]);

  // --- 4. FILTERING ---
  const featuredImages = useMemo(() => {
    const featured = images.filter(img => img.is_featured === true);
    return featured.length > 0 ? featured : images.slice(0, 5);
  }, [images]);

  const allFilteredImages = useMemo(() => {
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

  const visibleImages = allFilteredImages.slice(0, imageLimit);
  const visibleCategories = dynamicCategories.slice(0, categoryLimit);
  
  const handleShowMoreCategories = () => {
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
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">
      
      {/* --- SEO INJECTION --- */}
      <SEO 
        title="Home" 
        description="The premium gallery for AI art prompts. Copy exact prompts for Midjourney, Stable Diffusion, and DALL-E."
      />

      {/* --- SECTION 1: CAROUSEL --- */}
      <section className="mb-6">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="w-full h-64 md:h-96 bg-surfaceHighlight rounded-2xl animate-pulse border border-white/5 shadow-xl"></div>
          </div>
        ) : (
          featuredImages.length > 0 && <Carousel images={featuredImages} />
        )}
      </section>

      {/* --- SECTION 2: INTRO TEXT (Expanded for AdSense) --- */}
      <section className="max-w-4xl mx-auto px-4 text-center mb-6 mt-6">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-3">
          Free AI Art Prompts & Gallery
        </h1>
        <p className="text-textSecondary text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          ProGall is your ultimate resource for <strong>Midjourney, Stable Diffusion, and DALL-E prompts</strong>. 
          Stop struggling with "blank canvas syndrome". Browse our curated collection of high-quality AI art, 
          copy the exact prompt parameters, and generate stunning visuals for your projects in seconds.
        </p>
      </section>

      {/* --- SECTION 3: STICKY HEADER --- */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-white/5 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
            <input
              type="text"
              placeholder="Search prompts (e.g., 'cyberpunk', 'portrait', '8k')..."
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

      {/* --- SECTION 4: MAIN GRID --- */}
      <main className="max-w-7xl mx-auto px-4 mt-6 min-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-surfaceHighlight rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {visibleImages.map((img, index) => (
                <React.Fragment key={img.id}>
                  
                  {/* Image Card */}
                  <div className="break-inside-avoid relative group mb-4">
                    <Link to={`/image/${img.id}`} className="block relative overflow-hidden rounded-xl bg-surfaceHighlight border border-surfaceHighlight/50 hover:border-accent/50 transition-colors">
                      <img 
                        src={img.url} 
                        alt={img.prompt} 
                        loading="lazy"
                        className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                        <p className="text-white text-sm line-clamp-4 mb-4 leading-relaxed font-medium drop-shadow-md">"{img.prompt}"</p>
                        <div className="flex items-center justify-between gap-3">
                           <button
                            onClick={(e) => handleCopy(e, img.prompt, img.id)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                                copiedId === img.id ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                            }`}
                           >
                             {copiedId === img.id ? <Check size={16} /> : <Copy size={16} />}
                             {copiedId === img.id ? 'Copied' : 'Copy'}
                           </button>
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

                  {/* AD INJECTION: Insert AdCard after every 7th image */}
                  {(index + 1) % 7 === 0 && (
                    <AdCard className="mb-4" />
                  )}

                </React.Fragment>
              ))}
            </div>
            
            {allFilteredImages.length > imageLimit && (
              <div className="flex justify-center mt-12 mb-10">
                <button
                  onClick={() => setImageLimit(prev => prev + 30)}
                  className="px-8 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-white/10 rounded-full text-sm font-bold text-textPrimary transition-all flex items-center gap-2 shadow-lg"
                >
                  Load More Prompts <ChevronDown size={16} />
                </button>
              </div>
            )}
            
            {allFilteredImages.length === 0 && (
              <div className="text-center py-20 text-textSecondary"><p>No prompts found. Try a different search.</p></div>
            )}
          </>
        )}
      </main>

      {/* --- SECTION 5: CONTENT FOOTER (NEW: Helps Fix AdSense "Low Content" Error) --- */}
      <section className="bg-surface border-t border-surfaceHighlight mt-16 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="space-y-4">
            <div className="bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center text-accent mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Master Prompt Engineering</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              Learn how to control lighting, camera angles, and art styles. Our gallery includes exact parameters like <code>--ar 16:9</code>, <code>--v 6.0</code>, and negative prompts to help you become an AI art pro.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-purple-500 mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Copy, Paste, Create</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              No need to guess. Every image on ProGall comes with the full prompt used to generate it. Simply click "Copy" and paste it into Discord, Bing Image Creator, or Stable Diffusion.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Daily Inspiration</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              We update our database daily with trending styles including Cyberpunk, Anime, Photorealism, and 3D Rendering. Bookmark us to stay ahead of the generative AI curve.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
