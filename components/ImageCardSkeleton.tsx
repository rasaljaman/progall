import React from 'react';

const ImageCardSkeleton: React.FC = () => {
  return (
    <div className="mb-4">
      <div className="relative overflow-hidden rounded-xl bg-surface shadow-card border border-white/5">
        <div className="w-full h-64 bg-gray-700/50 animate-pulse"></div>
        <div className="absolute bottom-0 w-full p-3 bg-black/20">
           <div className="h-4 bg-gray-600/50 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ImageCardSkeleton;
