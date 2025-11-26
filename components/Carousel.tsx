import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageItem } from '../types';
import { Link } from 'react-router-dom';

interface CarouselProps {
  images: ImageItem[];
}

const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance optional, disabling for now as per prompt preference "manual swipe".
  // Keeping manual control.

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      <div className="relative group">
        {/* Main Image Card */}
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl bg-surface aspect-video md:aspect-[21/9] lg:aspect-[2/1] transition-all">
          <Link to={`/image/${currentImage.id}`}>
             <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 hover:scale-105"
            />
          </Link>
          
          {/* Overlay Gradient (Subtle) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
             <p className="text-sm font-medium bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                Featured
             </p>
          </div>
        </div>

        {/* Controls */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 -left-2 md:-left-6 transform -translate-y-1/2 bg-surfaceHighlight/80 hover:bg-accent hover:text-black text-white p-3 rounded-full backdrop-blur-sm shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={nextSlide}
          className="absolute top-1/2 -right-2 md:-right-6 transform -translate-y-1/2 bg-surfaceHighlight/80 hover:bg-accent hover:text-black text-white p-3 rounded-full backdrop-blur-sm shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
          aria-label="Next Slide"
        >
          <ChevronRight size={24} />
        </button>
        
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
            {images.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-accent w-6' : 'bg-surfaceHighlight'
                    }`}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
