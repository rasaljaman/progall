import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import { ImageItem } from '../types';

interface HeroProps {
  images: ImageItem[];
  totalCount: number;
}

// Platform tags shown below the headline
const PLATFORMS = ['Gemini', 'Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Firefly', 'Flux'];

const Hero: React.FC<HeroProps> = ({ images, totalCount }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Take up to 20 images for the marquee, duplicate for seamless loop
  const marqueeImages = images.slice(0, 20);
  const doubled = [...marqueeImages, ...marqueeImages];

  // Scroll page to gallery smoothly when clicking CTA
  const scrollToGallery = () => {
    const el = document.getElementById('gallery-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full overflow-hidden hero-mesh pt-28 pb-0 md:pt-32">

      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full bg-accentEnd/5 blur-3xl" />
      </div>

      {/* ── Center content ── */}
      <div className="relative max-w-4xl mx-auto px-5 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/25 bg-accent/8 text-accent text-xs font-semibold mb-6 shadow-sm">
          <Sparkles size={13} className="shrink-0" />
          {totalCount > 0 ? `${totalCount.toLocaleString()}+ Curated AI Prompts` : 'Curated AI Prompt Gallery'}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-textPrimary mb-5">
          Discover, Copy &{' '}
          <span className="text-gradient">Create</span>
          <br className="hidden sm:block" />
          {' '}AI Art Prompts
        </h1>

        {/* Sub-text */}
        <p className="text-base md:text-lg text-textSecondary leading-relaxed max-w-2xl mx-auto mb-8">
          The premium gallery for AI-generated art prompts. Browse thousands of curated images
          with their exact prompts — copy and paste into&nbsp;
          <strong className="text-textPrimary font-semibold">Gemini, Midjourney, DALL-E, or Stable Diffusion</strong>
          &nbsp;instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button
            onClick={scrollToGallery}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-accent text-white font-semibold text-sm shadow-accent hover:opacity-90 hover:shadow-glow transition-all active:scale-95"
          >
            Browse Gallery
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <Link
            to="/about"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-surface text-textPrimary font-semibold text-sm hover:bg-surfaceHighlight transition-all active:scale-95"
          >
            Learn More
          </Link>
        </div>

        {/* Platform pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          <span className="text-xs text-textSecondary mr-1">Works with:</span>
          {PLATFORMS.map((p) => (
            <span
              key={p}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                p === 'Gemini'
                  ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 font-semibold'
                  : 'bg-surfaceHighlight text-textSecondary border-border/50'
              }`}
            >
              {p === 'Gemini' ? '✦ ' : ''}{p}
            </span>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="flex flex-col items-center gap-1 text-textSecondary/40 mb-4">
          <ChevronDown size={18} className="animate-bounce" />
        </div>
      </div>

      {/* ── Marquee image strip ── */}
      {marqueeImages.length > 0 && (
        <div className="relative w-full mt-2 overflow-hidden">
          {/* Left/Right fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

          {/* Track */}
          <div
            ref={trackRef}
            className="marquee-track flex gap-3 w-max"
          >
            {doubled.map((img, i) => (
              <Link
                key={`${img.id}-${i}`}
                to={`/image/${img.id}`}
                className="group relative shrink-0 w-52 h-36 md:w-64 md:h-44 rounded-2xl overflow-hidden border border-border/50 hover:border-accent/40 transition-all hover:scale-[1.02] hover:shadow-xl shadow-md"
              >
                <img
                  src={img.thumbnail || img.url}
                  alt={img.prompt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-white text-[11px] line-clamp-2 leading-snug">{img.prompt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom gradient fade into page */}
      <div className="pointer-events-none h-16 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
};

export default Hero;
