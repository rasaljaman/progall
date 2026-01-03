import React, { useEffect, useRef } from 'react';

const AdCard: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      if (adRef.current) {
        adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className="break-inside-avoid mb-4 relative group rounded-xl overflow-hidden bg-surface border border-surfaceHighlight shadow-sm">
      
      {/* Label */}
      <div className="bg-surfaceHighlight/30 p-1 flex items-center justify-center border-b border-white/5">
        <span className="text-[9px] uppercase font-bold tracking-widest text-textSecondary opacity-40">
          Sponsored
        </span>
      </div>

      {/* NATIVE AD CONTAINER */}
      <div className="w-full bg-surface min-h-[280px]"> {/* min-h helps prevent layout shift */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-format="fluid"
          data-ad-layout-key="PASTE_YOUR_LAYOUT_KEY_HERE" 
          data-ad-client="ca-pub-3266776208656447"
          data-ad-slot="PASTE_YOUR_SLOT_ID_HERE"
        ></ins>
      </div>

    </div>
  );
};

export default AdCard;
