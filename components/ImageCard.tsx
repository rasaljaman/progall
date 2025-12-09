import React, { useState } from 'react';
import { ImageItem } from '../types';
import { Link } from 'react-router-dom';

interface ImageCardProps {
  image: ImageItem;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="mb-4 break-inside-avoid">
      <Link 
        to={`/image/${image.id}`} 
        // Added 'bg-surfaceHighlight': Keeps a gray box visible before image loads
        className="block group relative overflow-hidden rounded-xl bg-surfaceHighlight shadow-card hover:shadow-2xl transition-all duration-300"
      >
        
        {/* 1. Loading Skeleton (Pulsing Effect) */}
        {!isLoaded && (
          <div className="absolute inset-0 z-0 bg-surfaceHighlight animate-pulse flex items-center justify-center">
             {/* Optional: You could add a small logo or icon here */}
          </div>
        )}

        {/* 2. The Image */}
        <img
          src={image.url}
          alt={image.prompt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          // Logic: Start invisible (opacity-0), then fade in (opacity-100)
          className={`w-full h-auto object-cover transform transition-all duration-700 ease-in-out relative z-10
            ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'}
            group-hover:scale-105
          `}
        />

        {/* 3. Hover Overlay */}
        <div className="absolute inset-0 z-20 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>
    </div>
  );
};

export default ImageCard;
