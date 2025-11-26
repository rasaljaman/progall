import React, { useState, useEffect, useMemo } from 'react';
import Carousel from '../components/Carousel';
import GalleryGrid from '../components/GalleryGrid';
import { ImageItem, SortOption } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Search, Filter, ArrowDownUp } from 'lucide-react';
import { CATEGORIES } from '../constants';

const Home: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await supabaseService.getImages();
        setImages(data);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const filteredImages = useMemo(() => {
    let result = [...images];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (img) =>
          img.prompt.toLowerCase().includes(q) ||
          img.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Filter
    if (selectedCategory !== 'All') {
      result = result.filter((img) => img.category === selectedCategory);
    }

    // Sort
    if (sortOption === 'newest') {
        // Mock created_at sort if string dates are present, else id
        result.sort((a, b) => (b.created_at || b.id).localeCompare(a.created_at || a.id));
    } else if (sortOption === 'oldest') {
        result.sort((a, b) => (a.created_at || a.id).localeCompare(b.created_at || b.id));
    }
    // "popular" would require a like count, omitting for simple demo logic

    return result;
  }, [images, searchQuery, selectedCategory, sortOption]);

  // Featured images for carousel (take first 5)
  const featuredImages = images.slice(0, 5);

  return (
    <div className="min-h-screen pb-10">
      {/* Carousel Section */}
      <section className="mb-6">
        <Carousel images={featuredImages} />
      </section>

      {/* Controls Section */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur py-4 px-4 border-b border-surfaceHighlight mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
             {/* Filter Dropdown (Simplified as buttons for better UX on mobile) */}
             <div className="flex items-center bg-surface rounded-lg p-1 border border-surfaceHighlight">
                <Filter size={16} className="ml-2 mr-2 text-textSecondary"/>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-sm text-white focus:outline-none p-1 pr-4 cursor-pointer"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-surface text-white">{cat}</option>
                    ))}
                </select>
             </div>

             {/* Sort Dropdown */}
             <div className="flex items-center bg-surface rounded-lg p-1 border border-surfaceHighlight">
                <ArrowDownUp size={16} className="ml-2 mr-2 text-textSecondary"/>
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-sm text-white focus:outline-none p-1 pr-4 cursor-pointer"
                >
                    <option value="newest" className="bg-surface text-white">Newest</option>
                    <option value="oldest" className="bg-surface text-white">Oldest</option>
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
              className="w-full bg-surface border border-surfaceHighlight text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto min-h-[50vh]">
        {loading ? (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
        ) : (
            <GalleryGrid images={filteredImages} />
        )}
      </section>
    </div>
  );
};

export default Home;
