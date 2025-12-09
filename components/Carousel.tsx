import React, { useState, useEffect } from 'react';
import { ImageItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CarouselProps {
  images: ImageItem[];
}

const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Auto-slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full max-w-7xl mx-auto mt-6 px-4">
      {/* Container aspect ratio */}
      <div className="relative group w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl bg-surfaceHighlight">
        
        {/* 2. Render ALL images stacked (for smooth crossfade) */}
        {images.map((img, index) => (
          <div
            key={img.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Link to={`/image/${img.id}`} className="block w-full h-full">
                <img
                    src={img.url}
                    alt={img.prompt}
                    // 3. Priority Loading: Load first image immediately, others lazily
                    loading={index === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover"
                />
                
                {/* Gradient & Text Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                
                <div className="absolute bottom-6 left-6 right-12 text-white">
                    <span className="text-accent text-xs font-bold uppercase tracking-wider mb-1 block">
                        Featured {img.category}
                    </span>
                    <p className="text-lg md:text-2xl font-light line-clamp-2 text-gray-100">
                        {img.prompt}
                    </p>
                </div>
            </Link>
          </div>
        ))}

        {/* 4. Controls - Always visible on mobile, hover on desktop */}
        <button
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-accent transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-accent transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
