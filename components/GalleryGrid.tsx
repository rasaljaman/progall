import React from 'react';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import ImageCardSkeleton from './ImageCardSkeleton';
import { ChevronDown, Search } from 'lucide-react';

interface GalleryGridProps {
  images: ImageItem[];
  loading?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
}

const SKELETON_COUNT = 8;

const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  loading = false,
  showLoadMore = false,
  onLoadMore,
}) => {

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ImageCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-textSecondary gap-3">
        <Search size={36} className="opacity-20" />
        <p className="text-sm font-medium">No images found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Same row-first grid as Home page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {images.map((img, idx) => (
          <ImageCard key={img.id} img={img} index={idx} />
        ))}
      </div>

      {/* Optional Load More */}
      {showLoadMore && onLoadMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            className="group flex items-center gap-2 px-8 py-3 rounded-full bg-surfaceHighlight border border-border text-textPrimary text-sm font-semibold hover:shadow-md transition-all"
          >
            Load More
            <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryGrid;
