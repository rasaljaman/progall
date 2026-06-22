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

// ── AI Tool Compatibility Data ─────────────────────────────────────────────
const AI_TOOL_COMPAT: Record<string, { tool: string; score: number; note: string }[]> = {
  default: [
    { tool: 'Midjourney v6',    score: 95, note: 'Excellent. Handles complex multi-element prompts natively.' },
    { tool: 'DALL-E 3',         score: 88, note: 'Very good. Uses natural language; slightly less precise with camera terms.' },
    { tool: 'Stable Diffusion', score: 82, note: 'Good. Use with SDXL; may need negative prompts for best results.' },
    { tool: 'Google Gemini',    score: 79, note: 'Good for quick iteration; excels at photorealistic styles.' },
  ],
  Anime: [
    { tool: 'Midjourney v6',    score: 97, note: 'Best-in-class for anime. Use --niji 6 flag for optimal results.' },
    { tool: 'Stable Diffusion', score: 95, note: 'Excellent with Anime-specific checkpoints like AnythingV5 or Counterfeit.' },
    { tool: 'DALL-E 3',         score: 75, note: 'Decent but may over-westernize anime character features.' },
    { tool: 'Google Gemini',    score: 70, note: 'Basic anime support; better for stylised illustration.' },
  ],
  Photorealistic: [
    { tool: 'Midjourney v6',    score: 94, note: 'Outstanding realism in v6. Add --style raw for photography look.' },
    { tool: 'DALL-E 3',         score: 91, note: 'Top-tier for photorealism; excellent skin textures and lighting.' },
    { tool: 'Google Gemini',    score: 89, note: 'Gemini Imagen excels at photorealistic portraits and scenes.' },
    { tool: 'Stable Diffusion', score: 85, note: 'Use Realistic Vision or DreamShaper checkpoint for best results.' },
  ],
  Cyberpunk: [
    { tool: 'Midjourney v6',    score: 96, note: 'Exceptional neon and urban atmosphere rendering.' },
    { tool: 'Stable Diffusion', score: 90, note: 'Great control over neon colors and gritty textures with SDXL.' },
    { tool: 'DALL-E 3',         score: 83, note: 'Strong composition but slightly less gritty than Midjourney.' },
    { tool: 'Google Gemini',    score: 78, note: 'Competent; best used for broader cyberpunk scene concepts.' },
  ],
  Fantasy: [
    { tool: 'Midjourney v6',    score: 97, note: 'Industry standard for fantasy art. Stunning lighting and detail.' },
    { tool: 'Stable Diffusion', score: 88, note: 'Great with fantasy-tuned LoRAs and DreamShaper checkpoint.' },
    { tool: 'DALL-E 3',         score: 85, note: 'Good narrative understanding; great for illustrated storybook style.' },
    { tool: 'Google Gemini',    score: 80, note: 'Solid for epic landscapes; less control over fine character detail.' },
  ],
  Portrait: [
    { tool: 'Midjourney v6',    score: 96, note: 'Exceptional facial detail and lighting control in portrait mode.' },
    { tool: 'DALL-E 3',         score: 92, note: 'Very natural-looking portraits; excellent for professional headshots.' },
    { tool: 'Stable Diffusion', score: 88, note: 'Use portrait-specific LoRAs for best facial coherence.' },
    { tool: 'Google Gemini',    score: 84, note: 'Strong for stylized portraits; occasional detail inconsistency.' },
  ],
};

const getToolCompat = (category: string) =>
  AI_TOOL_COMPAT[category] ?? AI_TOOL_COMPAT.default;

// ── Prompt Analysis Component ──────────────────────────────────────────────
const PromptBreakdown: React.FC<{ prompt: string, category: string }> = ({ prompt, category }) => {
  const parts = prompt.split(',').map(s => s.trim()).filter(Boolean);
  const subject = parts[0] || 'the main subject';
  const styleElements = parts.slice(1);
  const wordCount = prompt.split(' ').length;
  const toolCompat = getToolCompat(category);

  const aspectRatioTip =
    category === 'Portrait' ? '2:3 portrait ratio (--ar 2:3 in Midjourney) works best — keeps the face centered.' :
    category === 'Landscape' || category === 'Fantasy' ? '16:9 or 21:9 for cinematic widescreen (--ar 16:9). Great for wallpapers and covers.' :
    category === 'Anime' ? '2:3 for character art or 16:9 for scene illustrations.' :
    '1:1 for social media posts, 16:9 for desktop wallpapers, 2:3 for posters.';

  return (
    <div className="mt-10 mb-8 pt-8 border-t border-border/40 space-y-5">
      <h3 className="text-xl font-bold text-textPrimary">Prompt Engineering Deep-Dive</h3>

      {/* Intro */}
      <p className="text-sm text-textSecondary leading-relaxed">
        Creating high-quality <strong className="text-textPrimary">{category}</strong> AI art requires precise vocabulary and a structured approach. This prompt contains <strong className="text-textPrimary">{wordCount} words</strong> across <strong className="text-textPrimary">{parts.length} modifier segments</strong> — each serving a specific function in guiding the neural network toward a consistent, professional output.
      </p>

      {/* 1. Core Subject */}
      <div className="bg-surfaceHighlight p-4 rounded-xl border border-border/50">
        <h4 className="font-semibold text-textPrimary text-base mb-2">① Core Subject & Anchoring</h4>
        <p className="text-sm text-textSecondary leading-relaxed">
          The foundation of this generation is the opening declaration: <strong className="text-textPrimary">"{subject.length > 70 ? subject.substring(0, 70) + '...' : subject}"</strong>. Placing the primary subject at the very start assigns it the highest <em>attention weight</em> in the transformer model. This ensures the subject remains the focal point before any stylistic filters are applied — a fundamental rule of effective prompt structure across all major AI platforms.
        </p>
      </div>

      {/* 2. Style Modifiers */}
      {styleElements.length > 0 && (
        <div className="bg-surfaceHighlight p-4 rounded-xl border border-border/50">
          <h4 className="font-semibold text-textPrimary text-base mb-3">② Stylization & Atmosphere Modifiers</h4>
          <p className="text-sm text-textSecondary leading-relaxed mb-3">
            The following modifier tags push the model away from generic aesthetics toward a specific visual language:
          </p>
          <ul className="space-y-1.5 mb-3">
            {styleElements.slice(0, 5).map((style, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-accent font-bold mt-0.5 shrink-0">›</span>
                <span className="text-textSecondary"><strong className="text-textPrimary">{style}</strong> — conditioning parameter shaping color, texture, or compositional output.</span>
              </li>
            ))}
          </ul>
          {styleElements.length > 5 && (
            <p className="text-xs text-textSecondary/70 mb-3">+ {styleElements.length - 5} more modifiers in the full prompt above.</p>
          )}
          <p className="text-sm text-textSecondary leading-relaxed">
            Lighting keywords (e.g. <em>cinematic</em>, <em>volumetric</em>, <em>rim lighting</em>) override the AI's default flat illumination. Camera and medium parameters simulate specific lenses or artistic styles, producing a far more professional result than generic text alone.
          </p>
        </div>
      )}

      {/* 3. How to Use */}
      <div className="bg-surfaceHighlight p-4 rounded-xl border border-border/50">
        <h4 className="font-semibold text-textPrimary text-base mb-3">③ How to Use This Prompt in Your {category} Projects</h4>
        <ol className="space-y-3">
          {[
            {
              step: '1',
              title: 'Copy the full prompt',
              desc: 'Use the Copy Prompt button above to copy the complete text including all modifiers. Do not truncate — every comma-separated element contributes to the final output quality.',
            },
            {
              step: '2',
              title: 'Paste into your AI tool of choice',
              desc: 'For Midjourney: paste after /imagine. For DALL-E 3: paste directly into the prompt box. For Stable Diffusion: paste into the positive prompt field in Automatic1111 or ComfyUI.',
            },
            {
              step: '3',
              title: 'Remix by swapping the subject (optional)',
              desc: `To adapt this ${category} prompt for your own project, replace only the first segment — "${subject.substring(0, 45)}${subject.length > 45 ? '...' : ''}" — with your desired subject. Keep all lighting and style modifiers intact for a consistent aesthetic.`,
            },
            {
              step: '4',
              title: 'Iterate and refine',
              desc: 'AI generation is probabilistic — run the prompt 3–5 times and select the best result. Use the Troubleshooting section below if results differ from the example image.',
            },
          ].map(item => (
            <li key={item.step} className="flex gap-3">
              <span className="text-accent font-extrabold text-base leading-none mt-0.5 w-5 shrink-0">{item.step}.</span>
              <div>
                <p className="text-sm font-semibold text-textPrimary mb-0.5">{item.title}</p>
                <p className="text-sm text-textSecondary leading-relaxed">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 4. AI Tool Compatibility */}
      <div className="bg-surfaceHighlight p-4 rounded-xl border border-border/50">
        <h4 className="font-semibold text-textPrimary text-base mb-1">④ AI Tool Compatibility — {category} Style</h4>
        <p className="text-sm text-textSecondary mb-4">
          Not all AI generators handle every style equally. Here's how this {category} prompt is expected to perform across major platforms:
        </p>
        <div className="space-y-3">
          {toolCompat.map(({ tool, score, note }) => (
            <div key={tool}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-textPrimary">{tool}</span>
                <span className="text-xs font-bold text-accent">{score}%</span>
              </div>
              <div className="w-full bg-border/40 rounded-full h-1.5 mb-1">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-accent to-teal-400"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-textSecondary/80">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Advanced Tips */}
      <div className="bg-surfaceHighlight p-4 rounded-xl border border-border/50">
        <h4 className="font-semibold text-textPrimary text-base mb-3">⑤ Advanced Prompt Engineering Tips</h4>
        <div className="space-y-3 text-sm text-textSecondary">
          <p>
            <strong className="text-textPrimary">Negative prompts:</strong> In Stable Diffusion and with Midjourney's --no flag, adding exclusions like <em>blurry, watermark, low quality, deformed hands, extra fingers</em> significantly improves output consistency. Pair this prompt with a strong negative prompt for best results.
          </p>
          <p>
            <strong className="text-textPrimary">Aspect ratio:</strong> {aspectRatioTip} Experiment freely — the same prompt at different ratios can feel like a completely different piece.
          </p>
          <p>
            <strong className="text-textPrimary">Seed locking:</strong> Once you find a generation you love, note the seed number (visible in Midjourney's image metadata or the Stable Diffusion UI). Re-using the same seed with minor prompt edits lets you create a consistent character or scene series — invaluable for professional creative projects and brand consistency.
          </p>
          <p>
            <strong className="text-textPrimary">Iterative refinement:</strong> The most effective AI artists treat each prompt as a hypothesis. Change one element at a time, observe the effect on the output, and build a mental model of how that AI interprets specific keywords. ProGall's gallery is designed to give you hundreds of proven starting points for exactly this iterative discovery process.
          </p>
        </div>
      </div>
    </div>
  );
};

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
  const [showFullPrompt,    setShowFullPrompt]    = useState(false);
  const [showAllTags,       setShowAllTags]       = useState(false);

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

  const handleWhatsApp = () => {
    if (!image) return;
    logUserEvent('share', { method: 'whatsapp', item_id: image.id });

    // wa.me/?text= is the ONLY reliable cross-platform WhatsApp share method:
    //   Mobile  → opens WhatsApp app with caption pre-filled ✅
    //   Desktop → opens WhatsApp Web with caption pre-filled ✅
    // navigator.share causes: OS share dialog on desktop, text dropped on mobile.
    // The page URL at the bottom triggers WhatsApp's automatic image preview card.
    const caption = [
      `🎨 *AI Art Prompt* | ProGall`,
      ``,
      `📝 *Full Prompt:*`,
      image.prompt,
      ``,
      `🏷️ *Category:* ${image.category}`,
      ``,
      `🖼️ *View & download the image:*`,
      window.location.href,
    ].join('\n');

    window.open(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      '_blank',
      'noopener,noreferrer'
    );
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

  const handleSaveEdit = async (updatedImage: ImageItem, newFile?: File) => {
    try {
      const saved = await supabaseService.updateImage(updatedImage, newFile);
      setImage(saved);
      showToast('Updated successfully! 🎨');
    } catch (err: any) {
      showToast('Failed to save: ' + (err.message || err), 'error');
    }
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
  const seoDescription = image.editorial_summary?.trim() || `Explore this curated ${image.category} AI art prompt. Copy the exact text to recreate or remix this image in Midjourney, DALL-E 3, Stable Diffusion, or Google Gemini.`;
  const hasEditorial = Boolean(
    image.editorial_summary || image.editorial_notes || image.editorial_tips
  );
  const renderEditorialText = (text?: string) => {
    if (!text) return null;
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, idx) => (
        <p key={idx} className="text-sm text-textSecondary leading-relaxed">
          {line}
        </p>
      ));
  };

  return (
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">

      <SEO
        title={`${image.category} AI Art Prompt: ${image.prompt.substring(0, 45)}...`}
        description={seoDescription}
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

            {/* ── Quick Info card (fills blank space on desktop) ── */}
            <div className="hidden lg:block rounded-xl border border-border/50 bg-surfaceHighlight p-4 space-y-3">
              <p className="text-xs font-bold text-textSecondary uppercase tracking-wide">Prompt Info</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40">
                  <p className="text-lg font-bold text-textPrimary">{image.prompt.split(' ').length}</p>
                  <p className="text-[10px] text-textSecondary mt-0.5">Words</p>
                </div>
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40">
                  <p className="text-lg font-bold text-accent truncate px-1">{image.category}</p>
                  <p className="text-[10px] text-textSecondary mt-0.5">Category</p>
                </div>
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40">
                  <p className="text-lg font-bold text-textPrimary">{image.tags?.length ?? 0}</p>
                  <p className="text-[10px] text-textSecondary mt-0.5">Tags</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <span className="text-base">💡</span>
                <p className="text-[11px] text-textSecondary leading-relaxed">
                  Copy the prompt, open your AI tool, paste it, and attach a reference image if needed for accurate faces or styles.
                </p>
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="animate-slide-right space-y-5" style={{ '--card-delay': '200ms' } as React.CSSProperties}>

            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-2">
                {image.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-tight">Prompt Details</h1>
            </div>

            {/* Prompt box with show more/less */}
            <div className="relative bg-surfaceHighlight rounded-xl border border-border/50 p-5">
              <p className={`text-textPrimary text-base font-light leading-relaxed pr-8 transition-all ${
                showFullPrompt ? '' : 'line-clamp-3'
              }`}>
                {image.prompt}
              </p>
              {/* Show more / less toggle */}
              <button
                onClick={() => setShowFullPrompt(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-accent hover:opacity-75 transition-opacity"
              >
                {showFullPrompt
                  ? <><ChevronUp size={13} /> Show less</>
                  : <><ChevronDown size={13} /> Show full prompt</>
                }
              </button>
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

            {/* Action buttons — primary CTAs are Remix & Copy Prompt */}
            <div className="space-y-3">
              <button
                onClick={handleGeminiRemix}
                className="w-full py-3.5 bg-gradient-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-accent hover:opacity-90 transition-all hover:shadow-glow active:scale-[0.98]"
              >
                <Sparkles size={18} /> Remix on Gemini
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCopy} className="py-3 bg-surfaceHighlight border border-border rounded-xl text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors">
                  <Copy size={16} /> Copy Prompt
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

              {/* Save image — kept discreet; not a primary CTA */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-textPrimary transition-colors py-1 px-3 rounded-lg hover:bg-surfaceHighlight"
                >
                  <Download size={12} /> Save image to device
                </button>
              </div>
            </div>

            {/* Tags with show more/less */}
            {image.tags?.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {(showAllTags ? image.tags : image.tags.slice(0, 5)).map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-surfaceHighlight rounded-full text-xs text-textSecondary border border-border/50">
                      #{tag}
                    </span>
                  ))}
                </div>
                {image.tags.length > 5 && (
                  <button
                    onClick={() => setShowAllTags(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-accent hover:opacity-75 transition-opacity"
                  >
                    {showAllTags
                      ? <><ChevronUp size={13} /> Show less</>
                      : <><ChevronDown size={13} /> +{image.tags.length - 5} more tags</>
                    }
                  </button>
                )}
              </div>
            )}

            {hasEditorial && (
              <div className="rounded-2xl border border-border/50 bg-surfaceHighlight/60 p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-textSecondary uppercase tracking-wider">Curator Notes</p>
                  {image.editorial_summary && (
                    <p className="text-base font-semibold text-textPrimary mt-2">
                      {image.editorial_summary}
                    </p>
                  )}
                </div>
                {image.editorial_notes && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Why this prompt works</p>
                    {renderEditorialText(image.editorial_notes)}
                  </div>
                )}
                {image.editorial_tips && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Usage tips</p>
                    {renderEditorialText(image.editorial_tips)}
                  </div>
                )}
              </div>
            )}

            {/* Prompt Analysis / SEO Content Block */}
            <PromptBreakdown prompt={image.prompt} category={image.category} />

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
