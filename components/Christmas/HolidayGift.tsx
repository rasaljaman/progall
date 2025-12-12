import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// 1. Import the PNG
import giftBtnImg from '../../assets/gift_btn.png';

const HolidayGift: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (location.pathname === '/christmas') return null;
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-bounce-slow">
      <button
        onClick={() => navigate('/christmas')}
        // Removed CSS background colors. Now just a container for the PNG.
        className="relative group transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      >
        {/* 2. Render the PNG */}
        <img 
          src={giftBtnImg} 
          alt="Open Christmas Gift" 
          // Adjust w-20 h-20 if you want it bigger/smaller
          className="w-16 h-16 object-contain drop-shadow-2xl filter hover:brightness-110 transition-all"
        />
        
        {/* Tooltip (Kept this so users know what to do) */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0e0e10] border border-[#b88b2e] text-[#b88b2e] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
          Open Gift 🎁
        </div>
      </button>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default HolidayGift;
