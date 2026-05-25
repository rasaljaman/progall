import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabaseService } from '../services/supabaseService';
import { logUserEvent } from '../services/firebaseAnalytics';
import { TwitterPrompt } from '../types';
import {
  ArrowLeft, Copy, Check, Sparkles, Share2,
  Clock, Heart, Eye, ExternalLink, Calendar
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [promptData, setPromptData] = useState<TwitterPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchPrompt = async () => {
      setLoading(true);
      if (!id) return;
      try {
        const data = await supabaseService.getTwitterPromptById(id);
        if (!data) {
          showToast('Prompt not found', 'error');
          navigate('/');
          return;
        }
        setPromptData(data);
        logUserEvent('view_item', {
          item_id: data.id,
          item_name: data.prompt_text.substring(0, 50),
          item_category: 'Twitter',
        });
        supabaseService.trackEvent('VIEW_TWITTER', { prompt_id: data.id });
      } catch (err) {
        console.error('Error loading twitter prompt:', err);
        showToast('Error loading prompt details', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPrompt();
  }, [id, navigate, showToast]);

  const handleCopy = () => {
    if (!promptData) return;
    navigator.clipboard.writeText(promptData.prompt_text);
    setCopied(true);
    showToast('Prompt copied! 🎨');
    logUserEvent('copy_prompt', { item_id: promptData.id, prompt_length: promptData.prompt_text.length });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!promptData) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Twitter AI Prompt by @${promptData.handle}`,
          text: promptData.prompt_text,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback
      }
    }
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard! 🔗');
  };

  const handleGeminiRemix = () => {
    if (!promptData) return;
    logUserEvent('remix_gemini', { item_id: promptData.id, category: 'Twitter' });

    // Always copy prompt first so user can paste it in Gemini
    navigator.clipboard.writeText(promptData.prompt_text)
      .then(() => showToast('✅ Prompt copied! Paste it in Gemini.'))
      .catch(() => {});

    const ua = navigator.userAgent;
    const isAndroid = /android/i.test(ua);
    const isFirefox = /firefox|fxios/i.test(ua);

    if (isAndroid && !isFirefox) {
      const intentUrl =
        'intent:#Intent;' +
        'action=android.intent.action.MAIN;' +
        'category=android.intent.category.LAUNCHER;' +
        'package=com.google.android.apps.bard;' +
        'S.browser_fallback_url=https%3A%2F%2Fgemini.google.com%2Fapp;' +
        'end';

      const a = document.createElement('a');
      a.href = intentUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const fallbackTimer = setTimeout(() => {
        if (!document.hidden) {
          window.open('https://gemini.google.com/app', '_blank');
        }
      }, 2500);

      const cancelFallback = () => {
        if (document.hidden) clearTimeout(fallbackTimer);
      };
      document.addEventListener('visibilitychange', cancelFallback, { once: true });
    } else {
      window.open('https://gemini.google.com/app', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!promptData) return null;

  const mainImage = promptData.image_urls?.[0] || '';
  const seoDescription = `Explore this community AI prompt from X (Twitter) by @${promptData.handle}: "${promptData.prompt_text.substring(0, 100)}...". Copy it for Midjourney, DALL-E, and Gemini.`;

  return (
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">
      <SEO
        title={`Community Prompt by @${promptData.handle}: ${promptData.prompt_text.substring(0, 40)}...`}
        description={seoDescription}
        image={mainImage}
        url={`https://progall.tech/prompt/${promptData.id}`}
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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Left Column: Image */}
          <div className="animate-slide-left space-y-4" style={{ '--card-delay': '100ms' } as React.CSSProperties}>
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-xl shadow-black/10 bg-surfaceHighlight">
              <img src={mainImage} alt={promptData.prompt_text} className="w-full h-auto object-cover" />
            </div>
            
            {/* Quick Metrics */}
            <div className="rounded-xl border border-border/50 bg-surfaceHighlight p-4 space-y-3">
              <p className="text-xs font-bold text-textSecondary uppercase tracking-wide">Prompt Stats</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40 flex flex-col items-center justify-center">
                  <Heart size={16} className="text-rose-500 mb-1" />
                  <p className="text-sm font-bold text-textPrimary">{promptData.likes}</p>
                  <p className="text-[10px] text-textSecondary">Likes</p>
                </div>
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40 flex flex-col items-center justify-center">
                  <Eye size={16} className="text-accent mb-1" />
                  <p className="text-sm font-bold text-textPrimary">{promptData.views}</p>
                  <p className="text-[10px] text-textSecondary">Views</p>
                </div>
                <div className="bg-surface rounded-lg py-2.5 px-1 border border-border/40 flex flex-col items-center justify-center">
                  <Calendar size={16} className="text-indigo-500 mb-1" />
                  <p className="text-sm font-bold text-textPrimary truncate max-w-full px-1">
                    {promptData.tweeted_at ? new Date(promptData.tweeted_at).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-[10px] text-textSecondary">Tweeted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="animate-slide-right space-y-5" style={{ '--card-delay': '200ms' } as React.CSSProperties}>
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent mb-2">
                Community Sourced
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-textPrimary leading-tight">
                X / Twitter Prompt
              </h1>
              <p className="text-sm text-textSecondary mt-1">
                Shared by <strong className="text-textPrimary">{promptData.author}</strong> (
                <a
                  href={`https://x.com/${promptData.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-medium"
                >
                  @{promptData.handle}
                </a>)
              </p>
            </div>

            {/* Prompt Box */}
            <div className="relative bg-surfaceHighlight rounded-xl border border-border/50 p-5">
              <p className="text-textPrimary text-base font-light leading-relaxed pr-8">
                "{promptData.prompt_text}"
              </p>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface hover:bg-accent hover:text-white text-textSecondary transition-all"
                title="Copy prompt"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGeminiRemix}
                className="w-full py-3.5 bg-gradient-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-accent hover:opacity-90 transition-all hover:shadow-glow active:scale-[0.98]"
              >
                <Sparkles size={18} /> Remix on Gemini
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="py-3 bg-surfaceHighlight border border-border rounded-xl text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy Prompt
                </button>
                <button
                  onClick={handleShare}
                  className="py-3 bg-surfaceHighlight border border-border rounded-xl text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors"
                >
                  <Share2 size={16} /> Share Link
                </button>
              </div>

              {promptData.tweet_url && (
                <a
                  href={promptData.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#1DA1F2]/10 border border-[#1DA1F2]/25 text-[#1DA1F2] dark:text-[#38A1F3] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1DA1F2]/20 transition-all text-center block"
                >
                  <ExternalLink size={16} /> View Original Tweet on X
                </a>
              )}
            </div>

            {/* Model & Classification Metadata */}
            <div className="rounded-xl border border-border/50 bg-surfaceHighlight/60 p-5 space-y-3">
              <p className="text-xs font-bold text-textSecondary uppercase tracking-wider">Metadata</p>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                  <span className="text-textSecondary">Target Model</span>
                  <span className="font-semibold text-textPrimary bg-accent/10 px-2.5 py-0.5 rounded-full text-xs">
                    {promptData.model || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                  <span className="text-textSecondary">Source Source</span>
                  <span className="font-semibold text-textPrimary flex items-center gap-1 text-xs">
                    X (formerly Twitter) API v2
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-textSecondary">Pipeline Sourced</span>
                  <span className="font-semibold text-textPrimary flex items-center gap-1 text-xs">
                    <Clock size={12} /> {promptData.created_at ? new Date(promptData.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetail;
