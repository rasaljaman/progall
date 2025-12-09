import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import './masonry.css'; 
import ImageCardSkeleton from './ImageCardSkeleton';
import { ChevronDown } from 'lucide-react';

interface GalleryGridProps {
  images: ImageItem[];
  loading?: boolean;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, loading }) => {
  // 1. State for Pagination (Start with 20)
  const [visibleCount, setVisibleCount] = useState(20);

  const showMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const breakpointColumnsObj = {
    default: 4,    // 4 columns on large screens
    1100: 3,       // 3 columns on standard laptops
    700: 2,        // 2 columns on tablets/large phones
    500: 1         // 1 column on mobile
  };
  
  // 2. LOADING STATE
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

  // 3. EMPTY STATE
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No images found.</p>
      </div>
    );
  }

  // 4. SLICE DATA FOR PAGINATION
  const visibleImages = images.slice(0, visibleCount);

  // 5. MAIN RENDER
  return (
    <div className="px-4 pb-20">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {visibleImages.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </Masonry>

      {/* 6. SHOW MORE BUTTON */}
      {visibleCount < images.length && (
        <div className="mt-12 flex justify-center w-full">
          <button 
            onClick={showMore}
            className="group flex items-center gap-2 px-8 py-3 bg-surface border border-surfaceHighlight rounded-full text-textPrimary font-medium hover:border-accent hover:text-accent transition-all shadow-neumorphic"
          >
            Show More
            <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryGrid;
