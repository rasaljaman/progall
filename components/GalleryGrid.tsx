import React from 'react';
import { ImageItem } from '../types';
import ImageCard from './ImageCard';

interface GalleryGridProps {
  images: ImageItem[];
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-textSecondary">
        <p>No images found.</p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 px-4 pb-10">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
};

export default GalleryGrid;
