import React from 'react';
import { ImageItem } from '../types';
import { Link } from 'react-router-dom';

interface ImageCardProps {
  image: ImageItem;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  return (
    <div className="mb-4">
      <Link 
        to={`/image/${image.id}`} 
        className="block group relative overflow-hidden rounded-xl bg-surface shadow-card hover:shadow-2xl transition-all duration-300"
      >
        <img
          src={image.url}
          alt={image.prompt}
          loading="lazy"
          className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
        />
        { }
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
    </div>
  );
};

export default ImageCard;
