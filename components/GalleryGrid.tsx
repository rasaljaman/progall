import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import './masonry.css'; 
import ImageCardSkeleton from './ImageCardSkeleton';
import { ChevronDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal'; // Import the new component

interface GalleryGridProps {
  images: ImageItem[];
  loading?: boolean;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, loading }) => {
  const [visibleCount, setVisibleCount] = useState(20);

  const showMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };
  
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

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No images found.</p>
      </div>
    );
  }

  const visibleImages = images.slice(0, visibleCount);

  return (
    <div className="px-4 pb-20">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {visibleImages.map((image, index) => (
          // WRAP IMAGE CARD IN SCROLL REVEAL
          // We apply the layout classes (mb-4, break-inside-avoid) here instead of inside ImageCard
          <ScrollReveal key={image.id} className="mb-4 break-inside-avoid" delay={index % 4 * 50}> 
            <ImageCard image={image} />
          </ScrollReveal>
        ))}
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
