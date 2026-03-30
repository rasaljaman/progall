import React from 'react';

/**
 * Modern shimmer skeleton card — matches the grid image card size.
 * Uses the .skeleton-shimmer CSS class for the wave animation.
 */
const ImageCardSkeleton: React.FC = () => (
  <div className="rounded-2xl overflow-hidden border border-border/40 bg-surface">
    {/* Image area */}
    <div className="aspect-[4/3] w-full skeleton-shimmer" />

    {/* Text area */}
    <div className="p-3 space-y-2">
      <div className="h-3 w-3/4 rounded-full skeleton-shimmer" />
      <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
    </div>
  </div>
);

export default ImageCardSkeleton;
