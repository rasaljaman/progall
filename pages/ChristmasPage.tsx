import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import GalleryGrid from '../components/GalleryGrid';
import { Calendar, Gift } from 'lucide-react';

const ChristmasPage: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showConfetti, setShowConfetti] = useState(true);

  // 1. INITIALIZATION
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // 2. FETCH & FILTER
  useEffect(() => {
    const fetchChristmasImages = async () => {
      setLoading(true);
      const allImages = await supabaseService.getImages();
      
      const holidayKeywords = ['christmas', 'santa', 'snow', 'winter', 'holiday', 'reindeer', 'elf', 'gift', 'xmas', 'festive'];
      
      const filtered = allImages.filter(img => {
        const text = (img.prompt + img.tags.join(' ')).toLowerCase();
        return holidayKeywords.some(keyword => text.includes(keyword));
      });

      setImages(filtered);
      setLoading(false);
    };
    fetchChristmasImages();
  }, []);

  // 3. COUNTDOWN
  const calculateTimeLeft = () => {
    const christmas = new Date(new Date().getFullYear(), 11, 25);
    const now = new Date();
    if (now > christmas) christmas.setFullYear(christmas.getFullYear() + 1);
    const difference = +christmas - +now;
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    };
  };
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  return (
    // THEME: Deep Pine Background (#123926) with Soft Charcoal text base
    <div className="min-h-screen bg-[#123926] text-[#e2e8f0] pb-20 pt-6 page-enter relative overflow-x-hidden font-sans">
      
      {/* Confetti Colors: Gold, Red, White */}
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={150} colors={['#b88b2e', '#8a1717', '#ffffff']} />}

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-4 mb-12 text-center relative z-10">
        
        {/* Badge: Rich Burgundy (#8a1717) with Gold Text */}
        <div className="inline-block px-4 py-2 rounded-full bg-[#8a1717] text-[#b88b2e] font-bold text-xs uppercase tracking-widest border border-[#b88b2e]/30 shadow-lg mb-6">
          🎄 Special Holiday Event
        </div>
        
        {/* Title: Warm Gold (#b88b2e) with Christmas Font */}
        <h1 className="text-6xl md:text-8xl font-christmas text-[#b88b2e] mb-8 drop-shadow-2xl tracking-wide leading-tight">
          Christmas Collection
        </h1>
        
        {/* COUNTDOWN WIDGET: Soft Charcoal Glass (#0e0e10 with opacity) + Warm Wood Border */}
        <div className="flex justify-center gap-4 mb-8">
           <div className="bg-[#0e0e10]/60 backdrop-blur-md border border-[#7a4f36] px-8 py-4 rounded-xl flex items-center gap-4 shadow-xl">
              <Calendar className="text-[#8a1717]" size={28} />
              <div className="text-left">
                <span className="block text-[10px] text-[#b88b2e] uppercase font-bold tracking-widest">Countdown to Xmas</span>
                <span className="text-xl font-mono font-bold text-white tracking-widest">
                  {timeLeft.days}d : {timeLeft.hours}h
                </span>
              </div>
           </div>
        </div>

        <p className="text-gray-300/80 max-w-2xl mx-auto text-lg font-light leading-relaxed">
          Explore our curated gallery of AI-generated holiday magic. <br/>
          {/* From <span className="text-[#b88b2e] font-medium">Rustic Winter
          Scenes</span> to <span className="text-[#8a1717] font-medium">Dark
          Fantasy Nutcrackers</span>.*/}
       </p>
      </div>

      {/* GALLERY SECTION */}
      <div className="max-w-7xl mx-auto min-h-[50vh]">
        {loading ? (
           <div className="flex justify-center pt-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#b88b2e] border-r-transparent"></div>
           </div>
        ) : images.length > 0 ? (
           <GalleryGrid images={images} />
        ) : (
           <div className="text-center py-20 bg-[#0e0e10]/40 rounded-3xl border border-dashed border-[#7a4f36]/50 mx-4 backdrop-blur-sm">
              <Gift size={64} className="mx-auto text-[#7a4f36] mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-[#b88b2e]">The Sleigh is Empty...</h3>
              <p className="text-gray-400 mt-2">No Christmas images found yet. <br/>Admin, please upload images with tag "Christmas"!</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ChristmasPage;
