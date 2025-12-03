import React from 'react';
import Masonry from 'react-masonry-css';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';
import './masonry.css'; 

interface GalleryGridProps {
  images: ImageItem[];
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images }) => {
  
  const breakpointColumnsObj = {
    default: 4,    // 4 columns on large screens
    1100: 3,       // 3 columns on standard laptops
    700: 2,        // 2 columns on tablets/large phones
    500: 1         // 1 column on mobile
  };

  if (images.length === 0) {
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
};

export default GalleryGrid;
