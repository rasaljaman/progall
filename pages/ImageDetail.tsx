import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabaseService, supabase } from '../services/supabaseService';
import { logUserEvent } from '../services/firebaseAnalytics';
import { ImageItem } from '../types';
import {
  ArrowLeft, Copy, Check, Download, Edit2, Sparkles, Share2,
  Clock, Grid3x3, Layers, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import EditImageModal from '../components/EditImageModal';
import GalleryGrid from '../components/GalleryGrid';
import { useToast } from '../context/ToastContext';

// ── Social icons ──────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.487-.695-2.432-2.878-2.432-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
  </svg>
);

// ── CopyableTip — inline copyable prompt snippet ───────────────────────────
const CopyableTip: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-start gap-2 bg-surfaceHighlight rounded-lg border border-border/60 px-3 py-2">
      <code className="text-[11px] text-accent flex-1 leading-relaxed font-mono break-all">{text}</code>
      <button
        onClick={handleCopy}
        className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all mt-0.5 ${
          copied
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
            : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
        }`}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

// ── Tab definition ─────────────────────────────────────────────────────────
type TabId = 'related' | 'latest' | 'category';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  { id: 'related',  label: 'Related',       icon: <Layers size={15} />,   description: 'Same style & tags' },
  { id: 'latest',   label: 'Latest',        icon: <Clock size={15} />,    description: 'Recently uploaded' },
  { id: 'category', label: 'Same Category', icon: <Grid3x3 size={15} />,  description: 'Browse category' },
];

// ── Main Component ─────────────────────────────────────────────────────────
const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [image,           setImage]           = useState<ImageItem | null>(null);
  const [loading,         setLoading]          = useState(true);
  const [isAdmin,         setIsAdmin]          = useState(false);
  const [isEditModalOpen, setIsEditModalOpen]  = useState(false);
  const { showToast } = useToast();

  // ── Tab state ──
  const [activeTab,     setActiveTab]     = useState<TabId>('related');
  const [tabImages,     setTabImages]     = useState<ImageItem[]>([]);
  const [tabLoading,    setTabLoading]    = useState(false);
  const [tabFetchCache, setTabFetchCache] = useState<Partial<Record<TabId, ImageItem[]>>>({});

  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Scroll to top when image changes
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // ── Initial image fetch ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setTabFetchCache({});
      setActiveTab('related');
      if (!id) return;

      const { data: currentImg, error } = await supabase
        .from('images').select('*').eq('id', id).single();

      if (error || !currentImg) { navigate('/'); return; }

      setImage(currentImg);
      logUserEvent('view_item', {
        item_id: currentImg.id,
        item_name: currentImg.prompt.substring(0, 50),
        item_category: currentImg.category,
      });
      supabaseService.trackEvent('VIEW', { image_id: currentImg.id, category: currentImg.category });

      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  // ── Fetch images for a tab ────────────────────────────────────────────
  const fetchTab = useCallback(async (tab: TabId, img: ImageItem) => {
    // Return cached if available
    if (tabFetchCache[tab]) {
      setTabImages(tabFetchCache[tab]!);
      return;
    }

    setTabLoading(true);

    let result: ImageItem[] = [];

    if (tab === 'related') {
      const { data } = await supabase
        .from('images').select('*').neq('id', img.id).limit(100);
      if (data) {
        const ranked = data.map(i => {
          let score = 0;
          if (i.category === img.category) score += 10;
          const shared = i.tags?.filter((t: string) => img.tags?.includes(t)) || [];
          score += shared.length * 3;
          return { ...i, _score: score };
        });
        result = ranked
          .sort((a, b) => (b as any)._score - (a as any)._score)
          .slice(0, 12)
          .map(({ _score, ...i }) => i as ImageItem);
      }
    }

    if (tab === 'latest') {
      const { data } = await supabase
        .from('images').select('*').neq('id', img.id)
        .order('created_at', { ascending: false }).limit(12);
      result = (data || []) as ImageItem[];
    }

    if (tab === 'category') {
      const { data } = await supabase
        .from('images').select('*').neq('id', img.id)
        .eq('category', img.category)
        .order('created_at', { ascending: false }).limit(12);
      result = (data || []) as ImageItem[];
    }

    setTabFetchCache(prev => ({ ...prev, [tab]: result }));
    setTabImages(result);
    setTabLoading(false);
  }, [tabFetchCache]);

  // Fetch when tab or image changes
  useEffect(() => {
    if (image) fetchTab(activeTab, image);
  }, [activeTab, image]); // eslint-disable-line

  // ── Actions ────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!image) return;
    navigator.clipboard.writeText(image.prompt);
    showToast('Prompt copied! 🎨');
    logUserEvent('copy_prompt', { item_id: image.id, prompt_length: image.prompt.length });
  };

  const handleGeminiRemix = () => {
    if (!image) return;
    logUserEvent('remix_gemini', { item_id: image.id, category: image.category });

    // Always copy prompt first so user can paste it in Gemini
    navigator.clipboard.writeText(image.prompt)
      .then(() => showToast('✅ Prompt copied! Paste it in Gemini.'))
      .catch(() => {});

    const ua = navigator.userAgent;
    const isAndroid = /android/i.test(ua);
    const isFirefox = /firefox|fxios/i.test(ua);

    if (isAndroid && !isFirefox) {
      // LAUNCHER intent — launches the Gemini app exactly like tapping its icon.
      // Works in Chrome, Kiwi, Edge, Brave (all Chromium-based).
      // S.browser_fallback_url opens the website if the app is not installed.
      const intentUrl =
        'intent:#Intent;' +
        'action=android.intent.action.MAIN;' +
        'category=android.intent.category.LAUNCHER;' +
        'package=com.google.android.apps.bard;' +
        'S.browser_fallback_url=https%3A%2F%2Fgemini.google.com%2Fapp;' +
        'end';

      // Navigate via hidden anchor to avoid React Router interception
      const a = document.createElement('a');
      a.href = intentUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Fallback: if page is still visible after 2.5s, app didn't open—open web
      const fallbackTimer = setTimeout(() => {
        if (!document.hidden) {
          window.open('https://gemini.google.com/app', '_blank');
        }
      }, 2500);

      // Cancel fallback if user left the page (app opened successfully)
      const cancelFallback = () => {
        if (document.hidden) clearTimeout(fallbackTimer);
      };
      document.addEventListener('visibilitychange', cancelFallback, { once: true });
    } else {
      // iOS / Desktop / Firefox — open Gemini website
      window.open('https://gemini.google.com/app', '_blank');
    }
  };

  const handleDownload = () => {
    if (!image) return;
    logUserEvent('download_image', { item_id: image.id, category: image.category });
    const link = document.createElement('a');
    link.href = image.url; link.target = '_blank';
    link.download = `ProGall-${image.id}.jpg`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleWhatsApp = async () => {
    if (!image) return;
    logUserEvent('share', { method: 'whatsapp', item_id: image.id });
    if (navigator.share) {
      try {
        const caption = `"${image.prompt.slice(0, 150)}..."\n\n🔗 Get it here: ${window.location.href}`;
        await navigator.clipboard.writeText(caption);
        showToast('Caption copied! Paste it in WhatsApp.', 'success');
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], 'progall-art.jpg', { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'ProGall Art', text: caption }); return;
        }
      } catch { /* fall through */ }
    }
    const text = encodeURIComponent(`✨ AI Art from ProGall:\n\n"${image.prompt.substring(0, 100)}..."\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePinterest = () => {
    if (!image) return;
    logUserEvent('share', { method: 'pinterest', item_id: image.id });
    if (window.location.hostname.includes('localhost')) { showToast('Pinterest requires a live website', 'error'); return; }
    const description = encodeURIComponent(`AI Art Prompt: ${image.prompt.substring(0, 490)}... #AIArt`);
    const media = encodeURIComponent(image.url);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!image) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'ProGall Art', text: image.prompt, url: window.location.href }); return; }
      catch { /* fall through */ }
    }
    handleCopy();
  };

  const handleSaveEdit = async (updatedImage: ImageItem) => {
    try { await supabaseService.updateImage(updatedImage); setImage(updatedImage); showToast('Updated successfully!'); }
    catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (imgId: string) => {
    if (confirm('Delete this image permanently?')) { await supabaseService.deleteImage(imgId); navigate('/'); }
  };

  // ── Loading / not found ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
  if (!image) return null;

  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">

      <SEO
        title={image.prompt.substring(0, 50)}
        description={`Download high-quality ${image.category} AI art.`}
        image={image.url}
        url={`https://progall.tech/image/${image.id}`}
        type="article"
      />

      <div className="max-w-7xl mx-auto px-4">

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Gallery
        </button>

        {/* ── Main image + info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* Image */}
          <div className="animate-slide-left space-y-4" style={{ '--card-delay': '100ms' } as React.CSSProperties}>
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl shadow-black/10 bg-surfaceHighlight">
              <img src={image.url} alt={image.prompt} className="w-full h-auto" />
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-3 border border-dashed border-accent/30 text-accent rounded-xl hover:bg-accent/5 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Edit2 size={16} /> Edit Image
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="animate-slide-right space-y-5" style={{ '--card-delay': '200ms' } as React.CSSProperties}>

            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-2">
                {image.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-tight">Prompt Details</h1>
            </div>

            {/* Prompt box */}
            <div className="relative bg-surfaceHighlight rounded-xl border border-border/50 p-5">
              <p className="text-textPrimary text-base font-light leading-relaxed pr-8">{image.prompt}</p>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface hover:bg-accent hover:text-white text-textSecondary transition-all"
                title="Copy prompt"
              >
                <Copy size={15} />
              </button>
            </div>

            {/* AI Disclaimer banner */}
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                <span className="font-semibold">AI can make mistakes.</span>{' '}
                Results may vary — exact styles, faces, or details might differ. Use this prompt as a starting point and refine as needed.
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGeminiRemix}
                className="col-span-2 py-3.5 bg-gradient-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-accent hover:opacity-90 transition-all hover:shadow-glow active:scale-[0.98]"
              >
                <Sparkles size={18} /> Remix on Gemini
              </button>
              <button onClick={handleDownload} className="py-3 bg-surfaceHighlight border border-border rounded-xl text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors">
                <Download size={16} /> Download
              </button>
              <button onClick={handleShare} className="py-3 bg-surfaceHighlight border border-border rounded-xl text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors">
                <Share2 size={16} /> Share Link
              </button>
              <button onClick={handleWhatsApp} className="py-3 bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors">
                <WhatsAppIcon /> WhatsApp
              </button>
              <button onClick={handlePinterest} className="py-3 bg-[#E60023]/10 border border-[#E60023]/25 text-[#E60023] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#E60023]/20 transition-colors">
                <PinterestIcon /> Pin It
              </button>
            </div>

            {/* Tags */}
            {image.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {image.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-surfaceHighlight rounded-full text-xs text-textSecondary border border-border/50">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ══ Troubleshooting Accordion ══ */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <button
                onClick={() => setShowTroubleshoot(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surfaceHighlight hover:bg-border/40 transition-colors text-sm font-semibold text-textPrimary"
              >
                <span className="flex items-center gap-2 text-left">
                  <Lightbulb size={15} className="text-amber-500 shrink-0" />
                  Not getting the result you expected?
                </span>
                {showTroubleshoot
                  ? <ChevronUp size={15} className="text-textSecondary shrink-0" />
                  : <ChevronDown size={15} className="text-textSecondary shrink-0" />
                }
              </button>

              {showTroubleshoot && (
                <div className="px-4 pb-4 pt-3 bg-surface space-y-3">

                  {/* Face accuracy — copyable tip */}
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <p className="text-xs font-bold text-textPrimary">Face / person doesn't look accurate</p>
                    </div>
                    <p className="text-xs text-textSecondary leading-relaxed">
                      If the face doesn't match your reference image, append this phrase to the end of your prompt:
                    </p>
                    <CopyableTip text="use the attached reference image, maintain 100% accurate facial features, exact likeness, photorealistic face match" />
                    <p className="text-[11px] text-textSecondary/70">
                      💡 In Midjourney, also use <code className="bg-surfaceHighlight px-1 rounded text-accent">--cref [image URL]</code> to pass a character reference.
                    </p>
                  </div>

                  {/* Other tips */}
                  {[
                    {
                      icon: '🎨',
                      title: "Style or art direction is off",
                      tip: "Be more specific — instead of \"painting\", try \"impressionist oil painting with thick brushstrokes\" or name a known artist style like \"in the style of Greg Rutkowski\".",
                    },
                    {
                      icon: '🖼️',
                      title: "Wrong composition or framing",
                      tip: "Specify the shot type: \"extreme close-up\", \"full body portrait\", \"overhead aerial view\", or \"Dutch angle cinematic shot\". Include subject position if needed.",
                    },
                    {
                      icon: '🎭',
                      title: "Colors or mood don't feel right",
                      tip: "Name the palette explicitly: \"warm golden hour tones\", \"cool desaturated blues\", or \"vibrant neon cyberpunk colors\". Add mood words: \"melancholic\", \"epic\", \"peaceful\".",
                    },
                    {
                      icon: '⚙️',
                      title: "Image looks blurry or low quality",
                      tip: "Add quality boosters to the end of your prompt: \"8K resolution, ultra-detailed, sharp focus, professional photography\". In Midjourney try --q 2; in Stable Diffusion raise CFG scale to 7–10.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-surfaceHighlight border border-border/40">
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-textPrimary mb-0.5">{item.title}</p>
                        <p className="text-xs text-textSecondary leading-relaxed">{item.tip}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-start gap-2 mt-1 px-1">
                    <Info size={12} className="text-textSecondary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-textSecondary leading-relaxed">
                      AI generators are probabilistic — the same prompt can produce different results each run. Try tweaking the seed, model version, or a few words in the prompt for best results.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TABBED MORE IMAGES SECTION
        ════════════════════════════════════════════════════════ */}
        <div className="animate-fade-up border-t border-border/40 pt-10" style={{ '--card-delay': '300ms' } as React.CSSProperties}>

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-textPrimary">More to Explore</h2>
              <p className="text-sm text-textSecondary mt-0.5">{activeTabMeta.description}</p>
            </div>

            {/* Tab pills */}
            <div className="flex items-center gap-1.5 bg-surfaceHighlight/60 p-1 rounded-2xl border border-border/50 self-start sm:self-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-surface text-textPrimary shadow-sm ring-1 ring-border/50'
                      : 'text-textSecondary hover:text-textPrimary'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'category' && (
                    <span className="text-[10px] opacity-60 hidden sm:inline">({image.category})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <GalleryGrid images={tabImages} loading={tabLoading} />

        </div>
      </div>

      {/* Edit modal */}
      {isAdmin && image && (
        <EditImageModal
          image={image}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default ImageDetail;
