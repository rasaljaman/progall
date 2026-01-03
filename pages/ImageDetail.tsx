import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabaseService, supabase } from '../services/supabaseService';
import { logUserEvent } from '../services/firebaseAnalytics';
import { ImageItem } from '../types';
import { ArrowLeft, Copy, Download, Edit2, Sparkles, Share2 } from 'lucide-react'; 
import EditImageModal from '../components/EditImageModal';
import GalleryGrid from '../components/GalleryGrid';
import { useToast } from '../context/ToastContext';
// Removed AdCard import

// --- CUSTOM ICONS ---
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.487-.695-2.432-2.878-2.432-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
);

const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [image, setImage] = useState<ImageItem | null>(null);
  const [relatedImages, setRelatedImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!id) return;

      const { data: currentImg, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !currentImg) {
        navigate('/'); 
        return;
      }

      setImage(currentImg);
      
      logUserEvent('view_item', {
        item_id: currentImg.id,
        item_name: currentImg.prompt.substring(0, 50),
        item_category: currentImg.category
      });
      supabaseService.trackEvent('VIEW', { image_id: currentImg.id, category: currentImg.category });

      // RELATED IMAGES
      const { data: allImages } = await supabase
        .from('images')
        .select('*')
        .neq('id', currentImg.id)
        .limit(100);

      if (allImages) {
        const rankedImages = allImages.map(img => {
          let score = 0;
          if (img.category === currentImg.category) score += 10;
          const sharedTags = img.tags?.filter(tag => currentImg.tags?.includes(tag)) || [];
          score += (sharedTags.length * 3);
          return { ...img, relevanceScore: score };
        });

        const sorted = rankedImages
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8);

        setRelatedImages(sorted);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  // --- ACTIONS ---

  const handleCopy = () => {
    if (image) {
      navigator.clipboard.writeText(image.prompt);
      showToast('Prompt copied! 🎨');
      logUserEvent('copy_prompt', { item_id: image.id, prompt_length: image.prompt.length });
    }
  };
  
  const handleGeminiRemix = () => {
    if (image) {
      logUserEvent('remix_gemini', { item_id: image.id, category: image.category });
      window.open('https://gemini.google.com/app', '_blank');
      navigator.clipboard.writeText(image.prompt)
        .then(() => showToast('Prompt copied! Paste it in Gemini.'))
        .catch(() => showToast('Prompt copied!'));
    }
  };

  const handleDownload = () => {
    if (!image) return;
    logUserEvent('download_image', { item_id: image.id, category: image.category });
    const link = document.createElement('a');
    link.href = image.url;
    link.target = '_blank';
    link.download = `ProGall-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SMART SOCIAL HANDLERS ---
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
        const file = new File([blob], `progall-art.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'ProGall Art', text: caption });
          return;
        }
      } catch (err) { console.log("File share failed"); }
    }
    const text = encodeURIComponent(`✨ AI Art from ProGall:\n\n"${image.prompt.substring(0, 100)}..."\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePinterest = () => {
    if (!image) return;
    logUserEvent('share', { method: 'pinterest', item_id: image.id });
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
        showToast('Pinterest requires a live website (not localhost)', 'error');
        return;
    }
    const description = encodeURIComponent(`AI Art Prompt: ${image.prompt.substring(0, 490)}... #AIArt`);
    const media = encodeURIComponent(image.url);
    const url = encodeURIComponent(window.location.href);
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`;
    window.open(pinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!image) return;
    if (navigator.share) {
        try { await navigator.share({ title: 'ProGall Art', text: image.prompt, url: window.location.href }); } catch (err) { handleCopy(); }
    } else { handleCopy(); }
  };
  
  const handleSaveEdit = async (updatedImage: ImageItem) => {
    try { await supabaseService.updateImage(updatedImage); setImage(updatedImage); showToast('Updated successfully!'); } catch (err) { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image permanently?')) { await supabaseService.deleteImage(id); navigate('/'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent"></div></div>;
  if (!image) return null;

  return (
    <div className="min-h-screen pb-20 pt-6 page-enter">
      
      <SEO 
        title={image.prompt.substring(0, 50)} 
        description={`Download high-quality ${image.category} AI art. Prompt: ${image.prompt.substring(0, 150)}...`}
        image={image.url}
        url={`https://progall.tech/image/${image.id}`}
        type="article"
      />

      <div className="max-w-7xl mx-auto px-4">
        
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6 transition-colors">
          <ArrowLeft size={20} /><span>Back to Gallery</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: IMAGE */}
          <div className="space-y-4 relative">
             <img src={image.url} alt={image.prompt} className="w-full rounded-2xl border border-surfaceHighlight shadow-2xl" />
             
             {/* [REMOVED AD CARD FROM HERE] */}

             {isAdmin && (
              <button onClick={() => setIsEditModalOpen(true)} className="w-full py-3 border border-dashed border-accent/30 text-accent rounded-xl hover:bg-surfaceHighlight">
                <Edit2 size={18} className="inline mr-2"/> Edit
              </button>
            )}
          </div>

          {/* RIGHT COLUMN: DETAILS */}
          <div className="space-y-6">
            <div>
              <span className="text-accent text-sm font-bold uppercase">{image.category}</span>
              <h1 className="text-3xl font-bold text-textPrimary mt-1">Prompt Details</h1>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-surfaceHighlight group relative">
              <p className="text-textPrimary text-lg font-light leading-relaxed">{image.prompt}</p>
              <button onClick={handleCopy} className="absolute top-4 right-4 p-2 bg-black/5 rounded hover:bg-accent hover:text-white transition-colors"><Copy size={16} className="text-textSecondary"/></button>
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleGeminiRemix} className="col-span-2 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                <Sparkles size={20}/> Remix on Gemini
              </button>
              <button onClick={handleDownload} className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Download size={18}/> Download
              </button>
              <button onClick={handleShare} className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Share2 size={18}/> Share Link
              </button>
              <button onClick={handleWhatsApp} className="py-3 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] rounded-xl flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors font-semibold">
                <WhatsAppIcon /> WhatsApp
              </button>
              <button onClick={handlePinterest} className="py-3 bg-[#E60023]/10 border border-[#E60023]/20 text-[#E60023] rounded-xl flex items-center justify-center gap-2 hover:bg-[#E60023]/20 transition-colors font-semibold">
                <PinterestIcon /> Pin It
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {image.tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-surfaceHighlight rounded-lg text-sm text-textPrimary/70">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {relatedImages.length > 0 && (
          <div className="mt-20 border-t border-surfaceHighlight pt-10">
            <h2 className="text-2xl font-bold text-textPrimary mb-8">Related Styles</h2>
            <GalleryGrid images={relatedImages} />
          </div>
        )}

        {isAdmin && image && (
          <EditImageModal image={image} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEdit} onDelete={handleDelete}/>
        )}
      </div>
    </div>
  );
};

export default ImageDetail;
