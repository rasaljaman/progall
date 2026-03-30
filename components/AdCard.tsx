import React, { useEffect, useRef } from 'react';

const IS_DEV = (import.meta as any).env?.DEV ?? false;

const AdCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (IS_DEV) return;
    try {
      if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, []);

  // ── Dev placeholder — same size as an image card ──
  if (IS_DEV) {
    return (
      <div
        className={`
          rounded-2xl overflow-hidden border border-dashed border-accent/30 bg-accent/5
          aspect-[4/3] flex flex-col items-center justify-center gap-1.5
          ${className}
        `}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent/50">Ad</span>
        <span className="text-[9px] text-textSecondary opacity-40">hidden in dev</span>
      </div>
    );
  }

  // ── Production ad — same aspect-[4/3] as image cards ──
  return (
    <div
      className={`
        rounded-2xl overflow-hidden border border-border/40 bg-surface
        aspect-[4/3] flex flex-col
        ${className}
      `}
    >
      {/* "Sponsored" label */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center justify-center">
        <span className="text-[9px] uppercase font-bold tracking-widest text-textSecondary opacity-40">
          Sponsored
        </span>
      </div>

      {/* Ad unit fills remaining space */}
      <div className="flex-1 w-full">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-format="fluid"
          data-ad-layout-key="PASTE_YOUR_LAYOUT_KEY_HERE"
          data-ad-client="ca-pub-3266776208656447"
          data-ad-slot="PASTE_YOUR_SLOT_ID_HERE"
        />
      </div>
    </div>
  );
};

export default AdCard;
