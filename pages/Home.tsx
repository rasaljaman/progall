import React, { useState, useEffect, useMemo, useRef } from 'react';
import Carousel from '../components/Carousel';
import GalleryGrid from '../components/GalleryGrid';
import { ImageItem, SortOption } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Search, Filter, ArrowDownUp, Clock, X } from 'lucide-react';

const Home: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- SEARCH 2.0 STATE ---
  const [inputValue, setInputValue] = useState(''); // Immediate text
  const [debouncedQuery, setDebouncedQuery] = useState(''); // Delayed query (for filtering)
  const [isSearching, setIsSearching] = useState(false); // For spinner
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['All']);

  // Scroll State
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- 1. Load History on Mount ---
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  // --- 2. Debounce Logic (Anti-Lag) ---
  useEffect(() => {
    if (inputValue !== debouncedQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(inputValue);
        setIsSearching(false);
      }, 500); // Wait 500ms
      return () => clearTimeout(timer);
    }
  }, [inputValue, debouncedQuery]);
  
    // Add this useEffect to track searches
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 2) {
      supabaseService.trackEvent('SEARCH', { term: debouncedQuery });
    }
  }, [debouncedQuery]);


  // --- 3. History Helper ---
  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSearchSelect = (query: string) => {
    setInputValue(query);
    setDebouncedQuery(query);
    setShowHistory(false);
    addToHistory(query);
  };

  // Close history on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- 4. Scroll Logic ---
  useEffect(() => {
    const controlControls = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        // Hide if scrolling DOWN and not at the very top
        if (currentScrollY > lastScrollY && currentScrollY > 400) {
          setShowControls(false);
        } else {
          setShowControls(true);
        }
        setLastScrollY(currentScrollY);
      }
    };
    window.addEventListener('scroll', controlControls);
    return () => window.removeEventListener('scroll', controlControls);
  }, [lastScrollY]);

  // --- 5. Fetch Data ---
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const data = await supabaseService.getImages();
        setImages(data);
        if (data.length > 0) {
          const allCats = data.map(img => img.category);
          const uniqueCats = Array.from(new Set(allCats));
          setDynamicCategories(['All', ...uniqueCats.sort()]);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const featuredImages = useMemo(() => {
    const featured = images.filter(img => img.is_featured === true);
    return featured.length > 0 ? featured : images.slice(0, 5);
  }, [images]);

  // --- 6. Filtering (Uses debouncedQuery) ---
  const filteredImages = useMemo(() => {
    let result = [...images];
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (img) => img.prompt.toLowerCase().includes(q) || img.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter((img) => img.category === selectedCategory);
    }
    if (sortOption === 'newest') {
        result.sort((a, b) => (b.created_at || b.id).localeCompare(a.created_at || a.id));
    } else if (sortOption === 'oldest') {
        result.sort((a, b) => (a.created_at || a.id).localeCompare(b.created_at || b.id));
    }
    return result;
  }, [images, debouncedQuery, selectedCategory, sortOption]);

  return (
    <div className="min-h-screen pb-10 page-enter">
      
      <section className="mb-6">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="w-full h-64 md:h-96 bg-surfaceHighlight rounded-2xl animate-pulse border border-white/5 shadow-xl"></div>
          </div>
        ) : (
          featuredImages.length > 0 && <Carousel images={featuredImages} />
        )}
      </section>

      {/* SEO Text (Moved up slightly for better visibility) */}
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

      {/* --- SMART CONTROLS SECTION --- */}
      <section 
        className={`sticky top-16 z-40 bg-surface/95 backdrop-blur py-4 px-4
        border-b border-surfaceHighlight mb-6 transition-all duration-300
        ease-in-out ${
          showControls 
            ? 'translate-y-0 opacity-100 shadow-lg' 
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
          
          {/* Filters Row */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
             <div className="flex items-center bg-surface rounded-lg p-1 border border-surfaceHighlight">
                <Filter size={16} className="ml-2 mr-2 text-textSecondary"/>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-sm text-textPrimary focus:outline-none p-1 pr-4 cursor-pointer"
                >
                    {dynamicCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-surface text-textPrimary">{cat}</option>
                    ))}
                </select>
             </div>

             <div className="flex items-center bg-surface rounded-lg p-1 border border-surfaceHighlight">
                <ArrowDownUp size={16} className="ml-2 mr-2 text-textSecondary"/>
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-sm text-textPrimary focus:outline-none p-1 pr-4 cursor-pointer"
                >
                    <option value="newest" className="bg-surface text-textPrimary">Newest</option>
                    <option value="oldest" className="bg-surface text-textPrimary">Oldest</option>
                </select>
             </div>
          </div>

          {/* SEARCH BAR 2.0 */}
          <div className="relative w-full md:w-96 group" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-textSecondary group-focus-within:text-accent transition-colors">
              {/* Spinner while debouncing */}
              {isSearching ? <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"/> : <Search size={18} />}
            </div>
            
            <input
              type="text"
              placeholder="Search prompts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onKeyDown={(e) => e.key === 'Enter' && addToHistory(inputValue)}
              className="w-full bg-surface border border-surfaceHighlight text-textPrimary rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-textSecondary"
            />
            
            {/* Clear Button */}
            {inputValue && (
               <button onClick={() => { setInputValue(''); setDebouncedQuery(''); }} className="absolute inset-y-0 right-3 flex items-center text-textSecondary hover:text-textPrimary">
                  <X size={16} />
               </button>
            )}

            {/* SEARCH HISTORY DROPDOWN */}
            {showHistory && searchHistory.length > 0 && !inputValue && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surfaceHighlight rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-xs font-bold text-textSecondary bg-surfaceHighlight/50 uppercase">Recent Searches</div>
                {searchHistory.map((term, i) => (
                  <button key={i} onClick={() => handleSearchSelect(term)} className="w-full text-left px-4 py-3 text-sm text-textPrimary hover:bg-surfaceHighlight flex items-center gap-2 border-b border-surfaceHighlight last:border-0 transition-colors">
                    <Clock size={14} className="text-textSecondary" /> {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto min-h-[50vh]">
        <GalleryGrid images={filteredImages} loading={loading} />
      </section>
    </div>
  );
};

export default Home;
