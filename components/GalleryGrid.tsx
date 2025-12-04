import React from 'react';
import Masonry from 'react-masonry-css';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import './masonry.css'; 
import ImageCardSkeleton from './ImageCardSkeleton';

interface GalleryGridProps {
  images: ImageItem[];
  loading?:boolean;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, loading }) => {
  
  const breakpointColumnsObj = {
    default: 4,    // 4 columns on large screens
    1100: 3,       // 3 columns on standard laptops
    700: 2,        // 2 columns on tablets/large phones
    500: 1         // 1 column on mobile
  };
  
    // 1. IF LOADING: Show 12 Skeleton Cards
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

  // 2. IF DONE LOADING BUT EMPTY
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No images found.</p>
      </div>
    );
  }

  // 3. IF DATA EXISTS
  return (
    <div className="px-4 pb-10">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </Masonry>
    </div>
  );
};


 /* if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-10">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </Masonry>
    </div>
  );
}; */



export default GalleryGrid;
