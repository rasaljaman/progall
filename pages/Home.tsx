import React, { useState, useEffect, useMemo } from 'react';
import Carousel from '../components/Carousel';
import GalleryGrid from '../components/GalleryGrid';
import { ImageItem, SortOption } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Search, Filter, ArrowDownUp } from 'lucide-react';

const Home: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['All']);

  // --- 1. SMART SCROLL STATE ---
  const [showControls, setShowControls] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- 2. SCROLL LISTENER ---
  useEffect(() => {
    const controlControls = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Hide if scrolling DOWN and not at the very top (past 100px)
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowControls(false);
        } else {
          // Show if scrolling UP
          setShowControls(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlControls);
    return () => window.removeEventListener('scroll', controlControls);
  }, [lastScrollY]);

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

  const filteredImages = useMemo(() => {
    let result = [...images];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
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
  }, [images, searchQuery, selectedCategory, sortOption]);

  return (
    <div className="min-h-screen pb-10">
      
      <section className="mb-6">
        {loading ? (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <div className="w-full h-64 md:h-96 bg-surfaceHighlight rounded-2xl animate-pulse border border-white/5 shadow-xl"></div>
          </div>
        ) : (
          featuredImages.length > 0 && <Carousel images={featuredImages} />
        )}
      </section>

      {/* --- CONTROLS SECTION (Search, Filter, Sort) --- */}
      {/* Logic: Sticky at top-16 (below navbar). If showControls is false, slide it up (-translate-y) and hide it */}
      <section 
        className={`sticky top-16 z-40 bg-surface/95 backdrop-blur py-4 px-4 border-b border-surfaceHighlight mb-6 transition-all duration-300 ease-in-out ${
          showControls 
            ? 'translate-y-0 opacity-100 shadow-lg' 
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
             {/* Filter Dropdown */}
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

             {/* Sort Dropdown */}
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

          {/* Search Bar */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-textSecondary group-focus-within:text-accent transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-surfaceHighlight text-textPrimary rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-textSecondary"
            />
          </div>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 text-center mb-8 mt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-3">
          Discover the Best AI Art Prompts
        </h1>
        <p className="text-textSecondary text-sm md:text-base leading-relaxed">
          Browse our extensive gallery of high-quality AI-generated images. 
          Copy exact prompts for Gemini Nano Banana, Midjourney, Stable Diffusion, and DALL-E to recreate 
          stunning styles in Anime, Cyberpunk, 3D Render, and Photorealistic aesthetics.
        </p>
      </section>

      <section className="max-w-7xl mx-auto min-h-[50vh]">
        <GalleryGrid images={filteredImages} loading={loading} />
      </section>
    </div>
  );
};

export default Home;
