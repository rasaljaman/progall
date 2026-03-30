import React, { useEffect, useRef } from 'react';

const IS_DEV = (import.meta as any).env?.DEV ?? false;

const AdCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Skip AdSense entirely in development to avoid placeholder key errors
    if (IS_DEV) return;

    try {
      // Guard: only push if this specific ins element hasn't been filled yet
      if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  // In development, render a visible placeholder instead
  if (IS_DEV) {
    return (
      <div className={`break-inside-avoid mb-4 rounded-xl overflow-hidden border border-dashed border-accent/30 bg-accent/5 min-h-[120px] flex flex-col items-center justify-center gap-1 ${className}`}>
        <span className="text-[9px] uppercase font-bold tracking-widest text-accent/50">Ad Placeholder</span>
        <span className="text-[10px] text-textSecondary opacity-40">(hidden in dev mode)</span>
      </div>
    );
  }

  return (
    <div className={`break-inside-avoid mb-4 relative group rounded-xl overflow-hidden bg-surface border border-surfaceHighlight shadow-sm ${className}`}>

      {/* Label */}
      <div className="bg-surfaceHighlight/30 p-1 flex items-center justify-center border-b border-white/5">
        <span className="text-[9px] uppercase font-bold tracking-widest text-textSecondary opacity-40">
          Sponsored
        </span>
      </div>

      {/* NATIVE AD CONTAINER */}
      <div className="w-full bg-surface min-h-[280px]">
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

