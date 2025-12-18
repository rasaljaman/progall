import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import AdCard from './AdCard'; // Import the AdCard
import './masonry.css'; 
import ImageCardSkeleton from './ImageCardSkeleton';
import { ChevronDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { supabase } from '../services/supabaseService'; // Import Supabase for auth check

interface GalleryGridProps {
  images: ImageItem[];
  loading?: boolean;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, loading }) => {
  const [visibleCount, setVisibleCount] = useState(20);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Check if user is Admin (Logged in)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session); // true if logged in, false if visitor
    };
    checkUser();
  }, []);

  const showMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };
  
  // Loading State
  if (loading) {
    return (
      <div className="px-4 pb-10">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {[...Array(12)].map((_, index) => (
            <ImageCardSkeleton key={index} />
          ))}
        </Masonry>
      </div>
    );
  }

  // Empty State
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No images found.</p>
      </div>
    );
  }

  const visibleImages = images.slice(0, visibleCount);

  // 2. Logic to interleave Ads with Images
  const renderItems = () => {
    const items: React.ReactNode[] = [];

    visibleImages.forEach((image, index) => {
      // Push the Image
      items.push(
        <ScrollReveal key={image.id} className="mb-4 break-inside-avoid" delay={(index % 4) * 50}> 
          <ImageCard image={image} />
        </ScrollReveal>
      );

      // Insert Ad after every 5th image (5, 10, 15...)
      // CONDITION: Only if NOT Admin and not the very last item
      if (!isAdmin && (index + 1) % 5 === 0 && index !== visibleImages.length - 1) {
        items.push(
          <ScrollReveal key={`ad-${index}`} className="mb-4 break-inside-avoid" delay={100}>
             {/* AdCard container with fixed height matching your specific ad unit if needed */}
             <div className="w-full">
               <AdCard />
             </div>
          </ScrollReveal>
        );
      }
    });

    return items;
  };

  return (
    <div className="px-4 pb-20">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {renderItems()}
      </Masonry>

      {visibleCount < images.length && (
        <div className="mt-12 flex justify-center w-full">
          <ScrollReveal>
            <button 
                onClick={showMore}
                className="group flex items-center gap-2 px-8 py-3 bg-surface border border-surfaceHighlight rounded-full text-textPrimary font-medium hover:border-accent hover:text-accent transition-all shadow-neumorphic active:scale-95"
            >
                Show More
                <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
};

export default GalleryGrid;
