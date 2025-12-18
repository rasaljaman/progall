import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent duplicate scripts if component re-renders
    if (bannerRef.current && bannerRef.current.innerHTML === '') {
      
      // 1. Create the Script Element
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = "false"; // Required by your ad network
      script.src = "https://pl28283667.effectivegatecpm.com/1317a1094031b2094e9efc0f6aa99bd0/invoke.js";
      
      // 2. Append it to the container
      bannerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-[#0e0e10] border-2 border-dashed border-[#b88b2e]/30 shadow-card flex flex-col items-center justify-center p-4 min-h-[300px]">
      
      {/* "Sponsored" Label */}
      <div className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest border border-yellow-500/20 z-10">
        Ad
      </div>

      {/* THE AD CONTAINER - Using your specific ID */}
      <div 
        ref={bannerRef}
        id="container-1317a1094031b2094e9efc0f6aa99bd0" 
        className="w-full h-full flex items-center justify-center"
      >
        {/* Script will inject the ad here automatically */}
      </div>
      
      {/* Footer to make it look like a Gallery Card */}
      <div className="absolute bottom-0 w-full p-3 bg-black/40 backdrop-blur-sm flex justify-between items-center border-t border-white/5 z-20">
         <span className="text-xs text-gray-500">Sponsored Content</span>
         <button className="text-gray-400 hover:text-white text-xs">Open ↗</button>
      </div>
    </div>
  );
};

export default AdCard;
